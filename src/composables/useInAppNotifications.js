import { ref, onMounted, onUnmounted } from 'vue'
import { db, auth } from '../firebase'
import { useToast } from './useToast'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  doc, 
  getDoc,
  serverTimestamp,
  getDocs,
  Timestamp 
} from 'firebase/firestore'

export function useInAppNotifications() {
  const notifications = ref([])
  const unreadCount = ref(0)
  let unsubscribe = null
  let knownNotificationIds = new Set()
  const { showNotificationToast } = useToast()

  // Crea una notifica per tutti gli utenti condivisi
  async function createNotificationForSharedUsers(transaction, sharedUserIds, creatorName) {
    if (!sharedUserIds || sharedUserIds.length === 0) return

    const notificationData = {
      type: 'new_transaction',
      title: 'New Transaction',
      message: `${creatorName} added: ${transaction.description} - €${transaction.amount}`,
      transactionId: transaction.id,
      createdAt: serverTimestamp(),
      read: false,
      transactionData: {
        amount: transaction.amount,
        category: transaction.category,
        type: transaction.type,
        description: transaction.description
      }
    }

    // Crea una notifica per ogni utente condiviso (escluso il creatore)
    const currentUserId = auth.currentUser?.uid
    const promises = []
    
    for (const userId of sharedUserIds) {
      if (userId !== currentUserId) {
        const promise = addDoc(collection(db, 'apps', 'budget', 'notifications'), {
          ...notificationData,
          userId: userId
        })
        promises.push(promise)
      }
    }

    try {
      await Promise.all(promises)
    } catch (error) {
      console.error('Errore nella creazione delle notifiche:', error)
    }
  }

  // Ascolta le notifiche dell'utente corrente
  function startListening() {
    const currentUserId = auth.currentUser?.uid
    if (!currentUserId) return

    const q = query(
      collection(db, 'apps', 'budget', 'notifications'),
      where('userId', '==', currentUserId)
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      // Mappa e ordina le notifiche lato client
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        // Ordina per createdAt decrescente (più recenti prima)
        const timeA = a.createdAt?.seconds || 0
        const timeB = b.createdAt?.seconds || 0
        return timeB - timeA
      })
      
      // Rileva solo le notifiche veramente nuove (non presenti nel set precedente)
      if (knownNotificationIds.size > 0) {
        const reallyNewNotifications = newNotifications.filter(notification => 
          !knownNotificationIds.has(notification.id) && !notification.read
        )
        
        // Mostra toast solo per le notifiche veramente nuove
        reallyNewNotifications.forEach(notification => {
          showNotificationToast(notification)
        })
      }
      
      // Aggiorna il set degli ID conosciuti
      knownNotificationIds = new Set(newNotifications.map(n => n.id))
      
      notifications.value = newNotifications
      unreadCount.value = notifications.value.filter(n => !n.read).length
    })
  }

  // Segna come letta
  async function markAsRead(notificationId) {
    try {
      await updateDoc(doc(db, 'apps', 'budget', 'notifications', notificationId), {
        read: true
      })
    } catch (error) {
      console.error('Errore nel segnare la notifica come letta:', error)
    }
  }

  // Segna tutte come lette
  async function markAllAsRead() {
    const unreadNotifications = notifications.value.filter(n => !n.read)
    const promises = unreadNotifications.map(notification => markAsRead(notification.id))
    
    try {
      await Promise.all(promises)
    } catch (error) {
      console.error('Errore nel segnare tutte le notifiche come lette:', error)
    }
  }

  // Ottieni tutti gli utenti che hanno accesso al budget (per le notifiche)
  async function getSharedUsers() {
    try {
      const currentUserId = auth.currentUser?.uid
      if (!currentUserId) return []

      // Prima ottieni il documento dell'utente corrente
      const currentUserDocRef = doc(db, 'users', currentUserId)
      const currentUserDoc = await getDoc(currentUserDocRef)
      
      if (!currentUserDoc.exists()) return []

      const currentUserData = currentUserDoc.data()
      const sharedUserIds = new Set()

      // Aggiungi gli utenti con cui l'utente corrente condivide
      if (currentUserData.sharedWith && Array.isArray(currentUserData.sharedWith)) {
        currentUserData.sharedWith.forEach(userId => {
          sharedUserIds.add(userId)
        })
      }

      // Ora cerca tutti gli utenti che hanno l'utente corrente nella loro lista sharedWith
      const allUsersSnapshot = await getDocs(collection(db, 'users'))
      allUsersSnapshot.docs.forEach(userDoc => {
        const userData = userDoc.data()
        const userId = userDoc.id

        if (userId !== currentUserId && userData.sharedWith && Array.isArray(userData.sharedWith)) {
          if (userData.sharedWith.includes(currentUserId)) {
            sharedUserIds.add(userId)
          }
        }
      })

      return Array.from(sharedUserIds)
    } catch (error) {
      console.error('Errore nel recuperare gli utenti condivisi:', error)
      return []
    }
  }

  // Pulizia automatica delle notifiche vecchie (versione semplificata)
  async function cleanupOldNotifications() {
    try {
      const currentUserId = auth.currentUser?.uid
      if (!currentUserId) return

      // Query semplice per ottenere tutte le notifiche dell'utente
      const userNotificationsQuery = query(
        collection(db, 'apps', 'budget', 'notifications'),
        where('userId', '==', currentUserId)
      )

      const userNotificationsSnapshot = await getDocs(userNotificationsQuery)
      
      if (userNotificationsSnapshot.empty) return

      // Filtra lato client le notifiche vecchie da eliminare
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const notificationsToDelete = userNotificationsSnapshot.docs.filter(doc => {
        const data = doc.data()
        
        // Controlla la data
        let createdAt
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate()
        } else if (data.createdAt?.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000)
        } else {
          return false
        }
        
        return createdAt < thirtyDaysAgo
      })

      if (notificationsToDelete.length === 0) return

      // Elimina le notifiche vecchie in batch
      const deletePromises = notificationsToDelete.map(doc => 
        deleteDoc(doc.ref)
      )

      await Promise.all(deletePromises)
      console.log(`Cleanup: ${deletePromises.length} old notifications deleted`)
    } catch (error) {
      console.error('Errore durante la pulizia delle notifiche:', error)
    }
  }

  // Elimina tutte le notifiche lette immediatamente
  async function deleteAllReadNotifications() {
    try {
      const currentUserId = auth.currentUser?.uid
      if (!currentUserId) return

      // Query semplice per ottenere tutte le notifiche dell'utente
      const userNotificationsQuery = query(
        collection(db, 'apps', 'budget', 'notifications'),
        where('userId', '==', currentUserId)
      )

      const userNotificationsSnapshot = await getDocs(userNotificationsQuery)
      
      if (userNotificationsSnapshot.empty) return

      // Filtra tutte le notifiche lette
      const readNotifications = userNotificationsSnapshot.docs.filter(doc => {
        const data = doc.data()
        return data.read === true
      })

      if (readNotifications.length === 0) return

      // Elimina tutte le notifiche lette
      const deletePromises = readNotifications.map(doc => 
        deleteDoc(doc.ref)
      )

      await Promise.all(deletePromises)
      console.log(`Deleted ${deletePromises.length} read notifications`)
    } catch (error) {
      console.error('Errore durante l\'eliminazione delle notifiche lette:', error)
    }
  }

  // Pulizia delle notifiche lette (versione semplificata senza indici complessi)
  async function cleanupReadNotifications() {
    try {
      const currentUserId = auth.currentUser?.uid
      if (!currentUserId) return

      // Query semplice per ottenere tutte le notifiche dell'utente
      const userNotificationsQuery = query(
        collection(db, 'apps', 'budget', 'notifications'),
        where('userId', '==', currentUserId)
      )

      const userNotificationsSnapshot = await getDocs(userNotificationsQuery)
      
      if (userNotificationsSnapshot.empty) return

      // Filtra lato client le notifiche lette da eliminare
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const notificationsToDelete = userNotificationsSnapshot.docs.filter(doc => {
        const data = doc.data()
        if (!data.read) return false
        
        // Controlla la data
        let createdAt
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate()
        } else if (data.createdAt?.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000)
        } else {
          return false
        }
        
        return createdAt < sevenDaysAgo
      })

      if (notificationsToDelete.length === 0) return

      // Elimina le notifiche lette vecchie
      const deletePromises = notificationsToDelete.map(doc => 
        deleteDoc(doc.ref)
      )

      await Promise.all(deletePromises)
      console.log(`Cleanup: ${deletePromises.length} old read notifications deleted`)
    } catch (error) {
      console.error('Errore durante la pulizia delle notifiche lette:', error)
    }
  }

  // Cleanup listener quando il componente viene smontato
  function stopListening() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  onMounted(() => {
    // Avvia il listener solo se l'utente è autenticato
    if (auth.currentUser) {
      startListening()
      // Esegui pulizia automatica all'avvio (in background)
      setTimeout(() => {
        cleanupReadNotifications()
        cleanupOldNotifications()
      }, 2000)
    } else {
      // Se non è ancora autenticato, aspetta
      const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        if (user) {
          startListening()
          // Esegui pulizia automatica all'avvio (in background)
          setTimeout(() => {
            cleanupReadNotifications()
            cleanupOldNotifications()
          }, 2000)
          unsubscribeAuth()
        }
      })
    }
  })

  onUnmounted(() => {
    stopListening()
  })

  return {
    notifications,
    unreadCount,
    createNotificationForSharedUsers,
    markAsRead,
    markAllAsRead,
    getSharedUsers,
    startListening,
    stopListening,
    cleanupOldNotifications,
    cleanupReadNotifications,
    deleteAllReadNotifications
  }
}