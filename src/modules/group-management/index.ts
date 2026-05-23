import { registerDeliveryAction } from '../../delivery.js';
import { handleListKnownChats, handleRegisterGroup } from './register-group.js';

registerDeliveryAction('list_known_chats', handleListKnownChats);
registerDeliveryAction('register_group', handleRegisterGroup);
