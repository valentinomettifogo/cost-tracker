import { ref, onMounted, onUnmounted } from 'vue'
import { db, auth } from '../firebase'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs 
} from 'firebase/firestore'

export function useInAppNotifications() {
  const notifications = ref([])
  const unreadCount = ref(0)
  let unsubscribe = null

  // Crea una notifica per tutti gli utenti condivisi
  async function createNotificationForSharedUsers(transaction, sharedUserIds, creatorName) {
    if (!sharedUserIds || sharedUserIds.length === 0) return

    const notificationData = {
      type: 'new_transaction',
      title: 'Nuova Transazione',
      message: `${creatorName} ha aggiunto: ${transaction.description} - €${transaction.amount}`,
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
      console.log(`Notifiche create per ${promises.length} utenti`)
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
      where('userId', '==', currentUserId),
      orderBy('createdAt', 'desc')
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      notifications.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
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

      // Ottieni il documento dell'utente corrente per vedere con chi condivide
      const currentUserDoc = await getDocs(collection(db, 'users'))
      const sharedUserIds = new Set()

      // Cerca tutti gli utenti che condividono con l'utente corrente o viceversa
      currentUserDoc.docs.forEach(doc => {
        const userData = doc.data()
        const userId = doc.id

        // Se l'utente corrente è nella lista sharedWith dell'altro utente
        if (userData.sharedWith && Array.isArray(userData.sharedWith) && userData.sharedWith.includes(currentUserId)) {
          sharedUserIds.add(userId)
        }

        // Se l'altro utente è nella lista sharedWith dell'utente corrente
        if (userId === currentUserId && userData.sharedWith && Array.isArray(userData.sharedWith)) {
          userData.sharedWith.forEach(sharedId => sharedUserIds.add(sharedId))
        }
      })

      return Array.from(sharedUserIds)
    } catch (error) {
      console.error('Errore nel recuperare gli utenti condivisi:', error)
      return []
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
    } else {
      // Se non è ancora autenticato, aspetta
      const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        if (user) {
          startListening()
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
    stopListening
  }
}