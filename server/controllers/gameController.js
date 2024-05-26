const { Room, User } = require('../models/Game');

const createRoom = async (req, res) => {
  try {
    const { roomName, password, maxParticipants, gameMode, hintSettings, questions } = req.body;
    const ownerId = req.session.user_id;

    if (!ownerId) {
      return res.status(401).json({ message: 'Unauthorized: No user session found' });
    }

    const newRoom = new Room({ 
      roomName, 
      password, 
      maxParticipants, 
      gameMode, 
      hintSettings, 
      questions,
      ownerId 
    });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRooms = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const rooms = await Room.find()
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalRooms = await Room.countDocuments();

    res.status(200).json({
      rooms,
      totalPages: Math.ceil(totalRooms / limitNum),
      currentPage: pageNum
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const isAvailable = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.password !== password) {
      return res.status(403).json({ message: 'Invalid password' });
    }

    if (room.currentParticipants >= room.maxParticipants) {
      return res.status(403).json({ message: 'Room is full' });
    }

    room.currentParticipants += 1;
    await room.save();

    res.status(200).json({ message: 'Room is available', room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userInfo } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.currentParticipants >= room.maxParticipants) {
      return res.status(403).json({ message: 'Room is full' });
    }

    // 방의 hintSettings에서 허용된 키값만 userInfo에 포함되는지 확인
    const allowedKeys = room.hintSettings.map(setting => setting.infoType);
    const invalidKeys = Object.keys(userInfo).filter(key => !allowedKeys.includes(key));

    if (invalidKeys.length > 0) {
      return res.status(400).json({ message: `Invalid keys in userInfo: ${invalidKeys.join(', ')}` });
    }

    const userId = req.session.user_id;
    const newUser = new User({ user: userId, info: userInfo });

    room.participants.push(userId);
    room.currentParticipants += 1;
    room.userInfo.push(newUser);
    await room.save();

    res.status(200).json({ message: 'User added to the room', newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.session.user_id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: You are not the owner of this room' });
    }

    // 해당 방에 참여하고 있는 유저들 삭제
    await User.deleteMany({ _id: { $in: room.participants } });

    // 방 삭제
    await Room.findByIdAndDelete(roomId);

    res.status(200).json({ message: 'Room and its participants deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const findRoomByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createRoom,
  getRooms,
  isAvailable,
  joinRoom,
  deleteRoom,
  findRoomByCode
};
