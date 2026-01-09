// repositories/userRepository.js
 import pkg from '@prisma/client';                                                                                                               
const { PrismaClient } = pkg;   
const prisma = new PrismaClient();

const userRepository = {
  // Find user by ID
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  // Create a new user
  async createUser(userData) {
    return await prisma.user.create({
      data: userData,
    });
  },

  // Find user by email
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  // Find user by any field (flexible)
  async findByField(field) {
    return await prisma.user.findFirst({
      where: field,
    });
  },

  // Get all users
  async findAll() {
    return await prisma.user.findMany();
  },

  async updateData(id, data) {
    return await prisma.user.update({
      where: { id: id },
      data: data,
    });
  },
};

export default userRepository;
