<template>
  <div class="login-container">
    <div class="login-form">
      <h1 class="login-title">Login</h1>
      <input 
        class="form-input" 
        v-model="email" 
        type="email" 
        placeholder="Email" 
      />
      <input 
        class="form-input" 
        v-model="password" 
        type="password" 
        placeholder="Password" 
      />
      <button class="btn btn-primary" @click="handleLogin">Login</button>
      <button class="btn btn-secondary" @click="handleRegister">Register</button>
      <div class="divider">
        <span></span>
      </div>
      <button class="btn btn-google" @click="handleGoogle">
        <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Login with Google
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const email = ref('');
const password = ref('');
const { login, register, loginWithGoogle } = useAuth();

const handleLogin = async () => {
  try {
    await login(email.value, password.value);
  } catch (e) {
    alert(e.message);
  }
};

const handleRegister = async () => {
  try {
    await register(email.value, password.value);
  } catch (e) {
    alert(e.message);
  }
};

const handleGoogle = async () => {
  try {
    await loginWithGoogle();
  } catch (e) {
    alert(e.message);
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f3f4f6;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-title {
  text-align: center;
  color: #1f2937;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  font-weight: 700;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  outline: none;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(107, 114, 128, 0.4);
}

.btn-google {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.btn-google:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.google-icon {
  flex-shrink: 0;
  margin-right: 0.25rem;
}

.divider {
  position: relative;
  text-align: center;
  margin: 1rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}
</style>