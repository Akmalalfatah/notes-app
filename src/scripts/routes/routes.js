import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import LoginPage from '../pages/auth/login/login-page'; 
import RegisterPage from '../pages/auth/register/register-page'; 
import AddPage from '../pages/add/add-page'; 
import BookmarkPage from '../pages/bookmark/bookmark-page'; 

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/login': new LoginPage(), 
  '/register': new RegisterPage(), 
  '/add': new AddPage(),
  '/bookmark': new BookmarkPage(),
};

export default routes;