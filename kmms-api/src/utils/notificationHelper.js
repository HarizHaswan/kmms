// backend/src/utils/notificationHelper.js
const Notification = require('../config/models/Notification');
const User = require('../config/models/User');
const { getIO } = require('./socket'); // same utils folder

async function createNotification({ recipientId, type, title, body, data, createdBy }) {
  const n = new Notification({ recipient: recipientId, type, title, body, data, createdBy });
  await n.save();

  // Emit real-time event to recipient if socket is connected
  try {
    const io = getIO();
    // emit to a room named by recipientId (string)
    io.to(recipientId.toString()).emit('notification', n);
  } catch (err) {
    // io might not be initialized in some envs (e.g., during tests)
    console.warn('Socket emit skipped:', err.message);
  }

  return n;
}

async function createNotificationsForUsers(userIds, payload) {
  const docs = userIds.map(uid => ({ recipient: uid, ...payload }));
  const inserted = await Notification.insertMany(docs);

  // Emit to each user room individually
  try {
    const io = getIO();
    for (const doc of inserted) {
      io.to(doc.recipient.toString()).emit('notification', doc);
    }
  } catch (err) {
    console.warn('Socket emit skipped:', err.message);
  }

  return inserted;
}

async function getUserIdsByRole(role) {
  const users = await User.find({ role }).select('_id');
  return users.map(u => u._id);
}

async function notifyRole(role, type, title, body, data, createdBy) {
  const userIds = await getUserIdsByRole(role);
  if (userIds.length > 0) {
    await createNotificationsForUsers(userIds, { type, title, body, data, createdBy });
  }
}

module.exports = { createNotification, createNotificationsForUsers, getUserIdsByRole, notifyRole };
