const { Room, Question, Answer, User } = require('../models/Game');

const createRoom = async (req, res) => {
  try {
    const { roomName, password, maxParticipants, gameMode, hintSettings, questions } = req.body;
    const newRoom = new Room({ roomName, password, maxParticipants, gameMode, hintSettings, questions });
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
  
      const newUser = new User({ info: userInfo, roomId: room._id });
      await newUser.save();
  
      room.participants.push(newUser._id);
      room.currentParticipants += 1;
      await room.save();
  
      res.status(200).json({ message: 'User added to the room', newUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  
  


  const deleteRoom = async (req, res) => {
    try {
      const { roomId } = req.params;
  
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
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
  
  module.exports = {
    createRoom,
    getRooms,
    isAvailable,
    joinRoom,
    deleteRoom, // 추가된 부분
  };
