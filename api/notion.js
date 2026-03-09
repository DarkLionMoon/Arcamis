module.exports = async function(req, res) {
  try {
    var token = process.env.NOTION_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'NOTION_TOKEN mancante' });
    }

    var pageId = req.query.pageId || '2f00274fdc1c8065a11ff45192aa5dcb';

    var response = await fetch('https://api.notion.com/v1/pages/' + pageId, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Notion-Version': '2022-06-28'
      }
    });

    var data = await response.json();
    return res.status(200).json(data);

  } catch(e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
};
