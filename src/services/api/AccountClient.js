import md5 from 'md5';
import { post } from '../axiosConfig';

class AccountClient {
  static signIn(signInModal) {
    signInModal.password = md5(signInModal.password)
    return post(`/accounts/sign_in`, signInModal, {
      //workaround
      headers: {
        'DisableErrorHandler': true
      }
    });
  }

  static signOut() {
    //TODO: destroy token in server if server session exists
  }
}

export default AccountClient;
