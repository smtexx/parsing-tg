export async function login(page, login, password) {
  console.log('Начат процесс авторизации');

  // Click LogIn
  await page.click('i.icon.exit');
  console.log('Окно авторизации открыто');

  // Fill in form fields
  const loginSelector = '#form_sing_in input.user_email';
  await page.waitForSelector(loginSelector);
  await page.type(loginSelector, login);
  console.log('Логин введен');
  await page.waitForTimeout(1000);

  const passwordSelector = '#form_sing_in input.user_password';
  await page.waitForSelector(passwordSelector);
  await page.type(passwordSelector, password);
  console.log('Пароль введен');
  await page.waitForTimeout(1000);

  // Click sign in button
  await page.click('#form_sing_in div.js_sign_in_submit_button');
  console.log('Отправка автаризационного запроса');
  await page.waitForSelector('div.js_load_all_notifications');
  console.log('Авторизация завершена успешно');
}
