const USER_MESSAGES = Object.freeze({
  USER_BLOCKED: 'User blocked successfully',
  USER_UNBLOCKED: 'User unblocked successfully',
  USER_BLOCK_FAILED: 'Failed to block user',
  USER_UNBLOCK_FAILED: 'Failed to unblock user',
});

const CATEGORY_MESSAGE=Object.freeze({
  UPLOAD_IMAGE_REQUIRED: 'Upload Category image',
  CATEGORY_EXISTS: 'Category already exist',
  CATEGORY_ADDED: 'Category added successfully',
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_UNLISTED: 'Category unlisted successfully',
  CATEGORY_LISTED: 'Category listed successfully',
  CATEGORY_EDIT_FAILED: 'Unable to edit category',
  CATEGORY_EDITED: 'Category edited successfully',
  CATEGORY_DELETE_FAILED: 'Unable to delete Category',
  CATEGORY_DELETED: 'Category deleted successfully',
})

const MESSAGE = {
  ALL_FIELDS_REQUIRED: 'All fields are required',
  INVALID_PERCENTAGE: 'Invalid percentage value',
  STARTDATE_ENDDATE_ERROR: 'startDate should be less than enddate',
  OFFER_ADDED: 'Offer added successfully',
  OFFER_REMOVED: 'Offer removed successfully',
  SOMETHING_WENT_WRONG: 'Something went wrong',
  SERVER_ERROR: 'Server error',
  OFFER_NOTREMOVED:"Unable to remove offer"
};

const BRAND_MESSAGES = Object.freeze({
  ENTER_BRAND_NAME: 'Enter brand name',
  UPLOAD_BRAND_LOGO: 'Upload brand logo',
  BRAND_ALREADY_EXISTS: 'Brand already exists',
  BRAND_ADDED: 'Brand added successfully',
  BRAND_NOT_FOUND: 'Brand not found',
  UNABLE_TO_EDIT_BRAND: 'Unable to edit brand',
  BRAND_EDITED: 'Brand edited successfully',
  UNABLE_TO_UNLIST_BRAND: 'Unable to unlist brand',
  BRAND_UNLISTED: 'Brand unlisted successfully',
  UNABLE_TO_LIST_BRAND: 'Unable to list brand',
  BRAND_LISTED: 'Brand listed successfully',
  BRAND_ID_MISSING: 'Brand ID is missing',
  UNABLE_TO_REMOVE_OFFER: 'Unable to remove offer',
  BRAND_DELETED: 'Brand deleted successfully',
  UNABLE_TO_DELETE_BRAND: 'Unable to delete brand'
});

module.exports={
  USER_MESSAGES,
  CATEGORY_MESSAGE,
  MESSAGE,
  BRAND_MESSAGES

}