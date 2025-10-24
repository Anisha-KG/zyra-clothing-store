const User = require('../../models/userScema')
const httpStatus = require('../../Constants/httpStatuscode')
const message = require('../../Constants/messages')

const customerInfo = async (req, res) => {
  try {
    let search = ""
    if (req.query.search) {
      search = req.query.search
    }
    let page = 1
    if (req.query.page) {
      page = req.query.page
    }
    let limit = 9
    const userData = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } }
      ]
    })
      .sort({ CreatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()

    const count = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } }
      ]
    }).countDocuments()

    res.render('customers', {
      data: userData,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      search
    })

  } catch (error) {
    console.log('Error fetching customers', error)
    res.redirect('/pageerror')
  }
}

const customerBlocked = async (req, res) => {
  try {
    const { id } = req.body;
    await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.status(httpStatus.OK).json({ success: true, message: message.USER_MESSAGES.USER_BLOCKED });
  } catch (error) {
    console.log("Error while blocking customer:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: message.USER_MESSAGES.USER_BLOCK_FAILED });
  }
};

const customerUnblocked = async (req, res) => {
  try {
    const { id } = req.body;
    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.status(httpStatus.OK).json({ success: true, message: message.USER_MESSAGES.USER_UNBLOCKED });
  } catch (error) {
    console.log("Error while unblocking customer:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: message.USER_MESSAGES.USER_UNBLOCK_FAILED });
  }
};

module.exports = {
  customerInfo,
  customerBlocked,
  customerUnblocked
}