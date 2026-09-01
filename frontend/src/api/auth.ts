import { API_BASE } from '../config'

export async function login(username: string, password: string) {
  const body = new URLSearchParams()
  body.set('username', username)
  body.set('password', password)

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error('Invalid username or password')
  }

  return response.json()
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await fetch(`${API_BASE}/users/password-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail ?? 'Unable to reset password')
  }

  return data
}

export async function issuePasswordReset(
  token: string,
  userId: number,
) {
  const response = await fetch(
    `${API_BASE}/users/${userId}/password-reset`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail ?? 'Unable to issue recovery token')
  }

  return data
}

export async function changeMyPassword(
  currentPassword: string,
  newPassword: string,
  token: string,
): Promise<Record<string, any>> {
  const response = await fetch(`${API_BASE}/users/me/password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail ?? 'Unable to change password')
  }

  return response.json()
}
