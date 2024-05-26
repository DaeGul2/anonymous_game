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
  
      if (room.currentParticipants > room.maxParticipants) {
        return res.status(403).json({ message: 'Room is full' });
      }
  
      const newUser = new User({ info: userInfo });
      await newUser.save();
  
      res.status(200).json({ message: 'User added to the room', newUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  


  const leaveRoom = async (req, res) => {
    try {
      const { roomId } = req.params;
  
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      if (room.currentParticipants > 0) {
        room.currentParticipants -= 1;
        await room.save();
      }
  
      res.status(200).json({ message: 'User left the room', room });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  module.exports = {
    createRoom,
    getRooms,
    isAvailable,
    joinRoom,
    leaveRoom
  };
