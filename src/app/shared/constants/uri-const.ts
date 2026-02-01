// Khai báo uri cho FE
export const uriFeConst = {
  home: '/',                                                                // Trang chủ
  product: {
    index: '/product/index',                                                // Danh sách sản phẩm
    search: '/product/search',                                              // Tìm kiếm sản phẩm
    detail: '/product/detail',                                              // Chi tiết sản phẩm
    category: '/product/category'                                           // Danh mục sản phẩm
  },
  cart: {
    index: '/cart/index',                                                   // Giỏ hàng
  },
  checkout: {
    index: '/checkout',                                                     // Thanh toán
    success: '/checkout/success'                                            // Thanh toán thành công
  },
  user: {
    index: '/user/index',                                                   // Cá nhân
    profile: '/user/profile',                                               // Thông tin user
    profileEdit: '/user/profileedit',                                       // Sửa thông tin user
    points: '/user/points',                                                 // Tích điểm
    membership: '/user/membership',                                         // Hạng thành viên
    address: '/user/address',                                               // Sổ địa chỉ
    addressAdd: '/user/address/add',
    voucher: '/user/voucher',                                               // Mã khuyến mãi
    voucherDetail: '/user/voucherdetail',                                   // Chi tiết khuyến mãi
    edit: '/user/edit',
    favoriteProducts: '/user/favoriteproducts',                             // Sản phẩm yêu thích
    favoriteProductsDetail: '/user/favoriteproductsdetail',                 // Chi tiết danh sách
    affiliate: '/user/affiliate',                                           // affiliate
    aboutUs: '/user/aboutus',                                               // Về chúng tôi
    feedback: '/feedback',                                             // Phản hồi
  },
  news: {
    index: '/news',                                                   // Danh sách tin tức
    detail: '/news/detail',                                                 // Chi tiết tin tức
    category: '/news/category',                                             // Danh mục tin tức
  },
  album: {
    index: '/albums/index',                                                 // Danh sách album
    detail: '/albums/detail',                                               // Chi tiết album
  },
  promotion: {
    index: '/promotions/index',                                             // Danh sách chương trình khuyến mãi
    detail: '/promotions/detail',                                           // Chi tiết chương trình khuyến mãi
  },
  order: {
    tracking: '/order/tracking',                                            // Lịch sử đơn hàng
    trackingDetail: '/order/trackingdetail'                                 // Chi tiết đơn hàng
  },
  game: '/luckywheel/demo'
}

// Khai báo uri cho API
export const uriApiConst = {
  order: {
    tracking: '/zma/order/ordertracking',
    view: '/zma/order/view',
    checkVoucher: '/zma/order/checkvoucher',   // Check voucher
    calculateShipFee: '/zma/order/calculateshipfee',
    saveOrder: '/zma/order/save',
    hmacOrder: '/zma/order/zmahashmac',
  },
  user: {
    phone: '/api/zma/getphonenumber',
    feedback: '/zma/user/contact',      //gửi thông tin contact
    sendMessageZma: '/zma/user/sendmessagezma',      //gửi thông tin contact
  },
  game: {
    gameInfo: '/zma/game/gameinfor'  // Lấy thông tin game
  },
  product: {
    promotion: '/zma/product/promotion',  // Lấy sản phẩm flashsale
    productByCategory: '/zma/product/category', // Lấy sản phẩn theo danh mục
    loadCategory: '/zma/product/loadcategory', // Danh sách danh mục sản phẩm
    loadProduct: '/zma/product/searchproduct',
    category: '/zma/product/category',
    productView: '/zma/product/view',
    relatedProduct: '/zma/product/relatedproduct' // Lấy sản phẩm liên quan
  },
  store: {
    banner: '/zma/store/banner'
  },
  news: {
    newsDetail: '/zma/news/view',  // Chi tiết tin tức
    newsSearch: '/zma/news/search',
    newsCategory: '/zma/news/loadcategory'
  },
  search: {
    searchProduct: '/zma/search',
    suggestion: '/zma/search/suggestion'
  },
}
