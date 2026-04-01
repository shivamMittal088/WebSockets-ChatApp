import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { connectSocket } from '../socket'
import '../styles/LoginPage.css'

interface FieldErrors {
  firstName?: string
  lastName?: string
  emailId?: string
  password?: string
  confirmPassword?: string
  general?: string
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [shake, setShake] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [emailId, setEmailId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const clearFieldError = (field: keyof FieldErrors) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validate = (): boolean => {
    const newErrors: FieldErrors = {}

    if (isSignUp) {
      if (!firstName.trim()) newErrors.firstName = 'First name is required'
      if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    }

    if (!emailId.trim()) {
      newErrors.emailId = 'Email is required'
    } else if (!isValidEmail(emailId)) {
      newErrors.emailId = 'Invalid email address'
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (isSignUp) {
      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = 'Confirm your password'
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return false
    }
    return true
  }

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setEmailId('')
    setPassword('')
    setConfirmPassword('')
    setErrors({})
  }

  const handleToggleMode = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSignUp(!isSignUp)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const url = isSignUp ? '/auth/signup' : '/auth/login'
      const body = isSignUp
        ? { firstName, lastName, emailId, password }
        : { emailId, password }

      const { data } = await axios.post(url, body)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      connectSocket(data.user._id)
      navigate('/chat')
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setErrors({ general: err.response.data.message || 'Something went wrong' })
      } else {
        setErrors({ general: 'Unable to connect to server' })
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: keyof FieldErrors) =>
    errors[field] ? 'input-error' : ''

  return (
    <div className="login-wrapper">
      <div className="bubble bubble-1" />
      <div className="bubble bubble-2" />
      <div className="bubble bubble-3" />

      <div className={`login-card ${shake ? 'card-shake' : ''}`}>
        <div className="login-logo">
          <svg viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        </div>

        <h1 className="login-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="login-subtitle">{isSignUp ? 'Sign up to start chatting' : 'Login to continue chatting'}</p>

        {errors.general && <div className="error-message">{errors.general}</div>}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {isSignUp && (
            <div className="name-row">
              <div className="field-wrapper">
                <div className={`input-group ${inputClass('firstName')}`}>
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); clearFieldError('firstName') }}
                    aria-describedby="err-firstName"
                  />
                </div>
                {errors.firstName && <p className="field-error" id="err-firstName" role="alert">⚠ {errors.firstName}</p>}
              </div>
              <div className="field-wrapper">
                <div className={`input-group ${inputClass('lastName')}`}>
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); clearFieldError('lastName') }}
                    aria-describedby="err-lastName"
                  />
                </div>
                {errors.lastName && <p className="field-error" id="err-lastName" role="alert">⚠ {errors.lastName}</p>}
              </div>
            </div>
          )}

          <div className="field-wrapper">
            <div className={`input-group ${inputClass('emailId')}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13 2 4" />
              </svg>
              <input
                type="email"
                placeholder="Email address"
                value={emailId}
                onChange={(e) => { setEmailId(e.target.value); clearFieldError('emailId') }}
                aria-describedby="err-emailId"
              />
            </div>
            {errors.emailId && <p className="field-error" id="err-emailId" role="alert">⚠ {errors.emailId}</p>}
          </div>

          <div className="field-wrapper">
            <div className={`input-group ${inputClass('password')}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError('password') }}
                aria-describedby="err-password"
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="field-error" id="err-password" role="alert">⚠ {errors.password}</p>}
          </div>

          {isSignUp && (
            <div className="field-wrapper">
              <div className={`input-group ${inputClass('confirmPassword')}`}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword') }}
                  aria-describedby="err-confirmPassword"
                />
              </div>
              {errors.confirmPassword && <p className="field-error" id="err-confirmPassword" role="alert">⚠ {errors.confirmPassword}</p>}
            </div>
          )}

          {!isSignUp && (
            <div className="forgot-password">
              <a href="#">Forgot Password?</a>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <button type="button" className="google-btn" disabled={loading}>
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.41l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="signup-link">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <a href="#" onClick={handleToggleMode}>
              {isSignUp ? 'Login' : 'Sign up'}
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
