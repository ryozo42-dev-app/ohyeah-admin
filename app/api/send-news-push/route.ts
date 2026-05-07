import { NextResponse } from "next/server"
import admin from "firebase-admin"
import serviceAccount from "../../../firebase-service-account.json"

if (!admin.apps.length) {

  admin.initializeApp({
    credential:
      admin.credential.cert(serviceAccount as admin.ServiceAccount)
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
          newsId
        },

        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "default",
            clickAction:
              "FLUTTER_NOTIFICATION_CLICK"
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

    console.log("PUSH SUCCESS:", response)

    return NextResponse.json({
      success: true
    })

  } catch (err) {

    console.error("PUSH ERROR:", err)

    return NextResponse.json({
      success: false,
      error: String(err)
    })

  }

}