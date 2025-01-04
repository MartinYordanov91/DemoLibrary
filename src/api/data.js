import * as api from './api.js';

let primaryHost = 'http://localhost:3030'; // Основен хост
let fallbackHost = 'http://backuphost:3030'; // Резервен хост
let currentHost = primaryHost; // Текущият активен хост

export const login = api.login;
export const register = api.register;
export const logout = api.logout;


api.settings.host = currentHost;

// Функция за изпращане на заявка с fallback
async function requestWithFallback(method, url, data = undefined) {
    try {
        // Опит за изпращане на заявка към текущия хост
        return await api[method](currentHost + url, data);
    } catch (error) {
        console.error(`Request to ${currentHost} failed: ${error.message}`);
        
        // Превключване към резервния хост, ако основният хост не работи
        if (currentHost === primaryHost) {
            console.warn(`Switching to fallback host: ${fallbackHost}`);
            currentHost = fallbackHost;
            api.settings.host = fallbackHost;
        } else {
            console.warn(`Switching back to primary host: ${primaryHost}`);
            currentHost = primaryHost;
            api.settings.host = primaryHost;
        }

        // Втори опит с резервния хост
        return await api[method](currentHost + url, data);
    }
}

// Пример за обвивка около специфичните заявки
export async function createBook(data) {
    return await requestWithFallback('post', '/data/books', data);
}

export async function getAllBooks() {
    return await requestWithFallback('get', '/data/books?sortBy=_createdOn%20desc');
}

export async function getBookById(id) {
    return await requestWithFallback('get', '/data/books/' + id);
}

export async function deleteBookById(id) {
    return await requestWithFallback('del', '/data/books/' + id);
}

export async function updateBook(id, data) {
    return await requestWithFallback('put', '/data/books/' + id, data);
}

export async function getUserBooks(userId) {
    return await requestWithFallback(
        'get',
        `/data/books?where=_ownerId%3D%22${userId}%22&sortBy=_createdOn%20desc`
    );
}

export async function getBookTotalLikes(bookId) {
    return await requestWithFallback(
        'get',
        `/data/likes?where=bookId%3D%22${bookId}%22&distinct=_ownerId&count`
    );
}

export async function likeBookApi(bookId) {
    return await requestWithFallback('post', '/data/likes', { bookId });
}

export async function isUserAlreadyLiked(bookId, userId) {
    return await requestWithFallback(
        'get',
        `/data/likes?where=bookId%3D%22${bookId}%22%20and%20_ownerId%3D%22${userId}%22&count`
    );
}
