const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get DM chat history with another user
// @route   GET /api/chat/messages/:userId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const myId = req.user.id;
    const contactId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: contactId },
        { sender: contactId, receiver: myId },
      ],
    }).sort({ createdAt: 1 });

    // Mark incoming messages as read
    await Message.updateMany(
      { sender: contactId, receiver: myId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active chats list with last message
// @route   GET /api/chat/list
// @access  Private
exports.getChatList = async (req, res) => {
  try {
    const myId = req.user.id;

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }],
    }).sort({ createdAt: -1 });

    // Extract unique contact IDs and get their last message
    const contactsMap = new Map();

    messages.forEach((msg) => {
      const partnerId = msg.sender.toString() === myId ? msg.receiver.toString() : msg.sender.toString();
      
      if (!contactsMap.has(partnerId)) {
        contactsMap.set(partnerId, msg);
      }
    });

    const contactIds = Array.from(contactsMap.keys());
    const contacts = await User.find({ _id: { $in: contactIds } }).select('username profilePic');

    const chats = contacts.map((contact) => {
      const lastMessage = contactsMap.get(contact._id.toString());
      return {
        contact,
        lastMessage: lastMessage.content,
        lastSender: lastMessage.sender,
        unread: !lastMessage.read && lastMessage.receiver.toString() === myId,
        updatedAt: lastMessage.createdAt,
      };
    }).sort((a, b) => b.updatedAt - a.updatedAt);

    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
