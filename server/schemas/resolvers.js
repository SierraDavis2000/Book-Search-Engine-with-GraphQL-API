const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-errors");
const { User } = require("../models");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
        if (context.user) {
            const userData = await User.findOne({ _id: context.user._id })
            .select("-__v -password")
            .populate("books");
            return userData;
        }
        throw new AuthenticationError("Not logged in");
        },
        
    }, 
    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
      
            if (!user) {
              throw new AuthenticationError("Invalid Input");
            }
      
            const correctPswd = await user.isCorrectPassword(password);
            if (!correctPswd) {
              throw new AuthenticationError("Invalid Input");
            }
            const token = signToken(user);
      
            return { token, user };
        }, 
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
      
            return { token, user };
        },
        saveBook: async (parent, args, context) => {
            if (context.user) {
              const updateUser = await User.findByIdAndUpdate(
                { _id: context.user._id },
                { $addToSet: { savedBooks: args.input } },
                { new: true, runValidators: true }
              );
      
              return updateUser;
            }
        }, 
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
              const updateUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId: bookId } } },
                { new: true }
              );
              return updateUser;
            }
    
        },
    }
}

module.exports = resolvers;