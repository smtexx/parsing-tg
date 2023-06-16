import { ParsingError } from '../../common/ParsingError.js';

/**
 * Функция выполняет авторизацию пользователя на telega.in.
 * Страница браузера сама переходит на telefa.in в процессе авторизации!
 * Возвращает вкладку браузера, в которой пользователь уже авторизован
 *
 * @param {string} login - логин пользователя
 * @param {string} password - пароль пользователя
 * @param {import('playwright').Page} PAGE - объект страницы браузера из пакета playwright
 */

export async function login(login, password, PAGE) {
  console.log('Начат процесс авторизации');
  console.log('Переходим на https://telega.in/');

  const URL = 'https://telega.in/';
  const response = await PAGE.goto(URL);

  if (!response.ok()) {
    throw new ParsingError(`Ошибка при переходе на ${URL}`);
  }
  await PAGE.waitForLoadState('load');

  // Click LogIn
  await PAGE.click('i.icon.exit');
  console.log('Окно авторизации открыто');

  // Fill in form fields
  const loginSelector = '#form_sing_in input.user_email';
  await PAGE.waitForSelector(loginSelector);
  await PAGE.type(loginSelector, login);
  console.log('Логин введен');

  const passwordSelector = '#form_sing_in input.user_password';
  await PAGE.waitForSelector(passwordSelector);
  await PAGE.type(passwordSelector, password);
  console.log('Пароль введен');

  // Click sign in button
  await PAGE.click('#form_sing_in div.js_sign_in_submit_button');
  console.log('Отправка автаризационного запроса');

  try {
    await PAGE.waitForSelector('div.js_load_all_notifications', {
      timeout: 5000,
    });
    console.log('Авторизация завершена успешно');
    return PAGE;
  } catch (error) {
    throw new ParsingError(
      'Необходимо дополнительное подтверждение входа по email!'
    );
  }
}
