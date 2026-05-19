module.exports = () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  currentUser: {
    reload: jest.fn(),
    sendEmailVerification: jest.fn(),
    emailVerified: true,
  }
});
