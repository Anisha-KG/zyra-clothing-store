const User = require('../models/userScema')
const constants = require('../Constants/httpStatuscode')

//const userAuth=(req,res,next)=>{
// if(req.session.user){
// User.findById(req.session.user)
// .then((data)=>{
//  if(data && !data.isBlocked){
//  next()
// }else{
//  res.redirect('/login')
//  }
// })
// .catch((error)=>{
//   console.log('Error in user auth middleware')
//   res.status(500).send('Internal server error')
//  })
// }else{
// res.redirect('/login')
// }
//}

const checkSession = async (req, res, next) => {
  try {

    if (!req.session.user) {
      return res.redirect('/login');
    }

    const userData = await User.findById(req.session.user);
    if (!userData) {
      req.session.destroy(() => { });
      return res.redirect('/signup');
    }

    if (userData.isBlocked) {
      req.session.destroy(() => { });
      return res.render('login', { message: 'Your account has been blocked by admin.' });
    }

    next();

  } catch (error) {
    console.log('Error in checkSession middleware:', error);
    res.status(500).send('Server error');
  }
};

const isLogin = async (req, res, next) => {
  try {

    if (req.session.user) {
      const userData = await User.findById(req.session.user);

      if (userData && userData.isBlocked) {
        req.session.destroy(() => { });
        return res.render('login', { message: 'Your account has been blocked by admin.' });
      }

      return res.redirect('/home');
    }

    next();

  } catch (error) {
    console.log('Error in isLogin middleware:', error);
    res.status(500).send('Server error');
  }
};
const adminAuth = async (req, res, next) => {
  try {
    if (!req.session.admin) {
      res.redirect('/admin/login')
    } else {
      const adminId = req.session.admin
      const admin = await User.findById(adminId)
      if (admin && admin.isAdmin == true) {
        next()
      } else {
        res.redirect('/admin/login')
      }
    }
  } catch (error) {
    console.log('Access denied:not admin')
    res.status(INTERNAL_SERVER_ERROR).send('Server Error')
  }
}

const isAdminLogin = async (req, res, next) => {
  try {
    if (req.session.admin) {
      return res.redirect('/admin/dashboard');
    }
    next();
  } catch (error) {
    console.log('Error in isAdminLogin middleware:', error);
    res.status(500).send('Server error');
  }
};

module.exports = {
  // userAuth,
  adminAuth,
  checkSession,
  isLogin,
  isAdminLogin
}