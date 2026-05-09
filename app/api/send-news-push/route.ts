import { NextResponse } from "next/server"
import admin from "firebase-admin"

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey:
    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
}

if (!admin.apps.length) {

  admin.initializeApp({
    credential:
      admin.credential.cert(
        serviceAccount as admin.ServiceAccount
      )
  })

}

export async function POST(req: Request) {

  try {

    const body = await req.json()

    const title =
      body.title || "新着ニュース"

    const message =
      body.message || "ニュースが追加されました"

    const newsId =
      String(body.newsId || "")

    const response =
      await admin.messaging().send({

        topic: "news",

        notification: {
          title,
          body: message
        },

        data: {
          newsId,
          click_action:
            "FLUTTER_NOTIFICATION_CLICK"
        },

        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "default",
          }
        },

        apns: {

          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert"
          },

          payload: {

            aps: {

              alert: {
                title,
                body: message
              },

              sound: "default",

              badge: 1,

              contentAvailable: true,

              mutableContent: true

            }

          }

        }

      })

    console.log(
      "PUSH SUCCESS:",
      response
    )

    return NextResponse.json({
      success: true
    })

  } catch (err) {

    console.error(
      "PUSH ERROR:",
      err
    )

    return NextResponse.json({
      success: false,
      error: String(err)
    })

  }

}