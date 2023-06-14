export async function getLinksToTopicPages(PAGE) {
  console.log('Извлекаем ссылки на страницы с каналами по темам');
  await PAGE.waitForSelector('div.category');
  const dataValues = await PAGE.$$eval(
    'div.category ul li[data-similar][data-value]',
    (elements) =>
      elements.map((el) => ({
        topicShort: el.textContent,
        topic: el.getAttribute('data-similar'),
        link:
          'https://telega.in/catalog?filter%5Bchannel_theme_id%5D=' +
          el.getAttribute('data-value'),
        name: el.getAttribute('data-url_name'),
      }))
  );
  console.log('Извлечение ссылок на страницы прошло успешно');
  return dataValues;
}
