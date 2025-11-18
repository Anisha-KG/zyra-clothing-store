const User = require('../../models/userScema')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const logger=require('../../logger')

const pageerror = async (req, res) => {
  res.render('pageerror')
}

const loadLogin = async (req, res) => {
  if (req.session.admin) {
    return res.redirect('/admin/dashboard')
  }
  res.render('admin-login')
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email) {
      return res.render('admin-login', { message: 'Email is required' })
    }
    if (!password) {
      return res.render('admin-login', { message: 'Enter Password' })
    }
    const admin = await User.findOne({ email: email, isAdmin: true })
    if (!admin) {
      return res.render('admin-login', { message: 'Admin not found' })
    }
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.render('admin-login', { message: 'Invalid Password' })
    }

    req.session.admin = admin._id
    logger.info('Admin logged in successfully', {
      controller: 'adminLogin',
      action: 'login',
      route: req.originalUrl,
      method: req.method,
      status: 'success'
    });
    res.redirect('/admin/dashboard')
    
  } catch (error) {
    logger.error('Error while admin login',{
      controller:'admninLogin',
      action:'post login',
      message: error.message,
      stack: error.stack,
      route: req.originalUrl,
      method: req.method
    })
    res.redirect('/pageerror')
  }

}

const loadDashboard = async (req, res) => {
  if (req.session.admin) {
    try {
      return res.render('dashboard')
    } catch (error) {
      return res.render('pageerror')
    }
  } else {
    return res.render('admin-login')
  }

}

const logout = async (req, res) => {
  try {
    if (req.session.admin) {

      delete req.session.admin;

      req.session.save((err) => {
        if (err) {
          console.log('Error saving session during logout:', err);
          return res.redirect('/admin/pageerror');
        }
        return res.redirect('/admin/login');
      });
    } else {

      return res.redirect('/admin/login');
    }
  } catch (error) {
    console.log('Logout error:', error);
    return res.redirect('/admin/pageerror');
  }
};

module.exports = {
  loadLogin,
  login,
  loadDashboard,
  pageerror,
  logout,
}