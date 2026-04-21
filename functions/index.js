const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNewsPush = functions.firestore
  .document("news/{newsId}")
  .onCreate(async (snap) => {

    const data = snap.data();

    const message = {
      notification: {
        title: "新しいお知らせ",
        body: data?.title || "新着ニュース"
      },
      topic: "allUsers"
    };

    try {
      const response = await admin.messaging().send(message);
      console.log("通知送信成功:", response);
    } catch (error) {
      console.error("通知送信失敗:", error);
    }
  });