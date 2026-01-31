'use server'

import webpush, { PushSubscription as WebPushSubscription } from 'web-push'

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// This is now the CORRECT type for web-push
let subscription: WebPushSubscription | null = null

export async function subscribeUser(sub: PushSubscription) {
  subscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: Buffer.from(sub.getKey('p256dh')!).toString('base64'),
      auth: Buffer.from(sub.getKey('auth')!).toString('base64'),
    },
  }

  // In production: store this in a DB
  return { success: true }
}

export async function unsubscribeUser() {
  subscription = null
  return { success: true }
}

export async function sendNotification(message: string) {
  if (!subscription) {
    throw new Error('No subscription available')
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'Test Notification',
        body: message,
        icon: '/icon.png',
      })
    )

    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}