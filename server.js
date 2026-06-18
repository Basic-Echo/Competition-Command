const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// === 数据读写工具 ===
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('读取数据失败:', err);
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// === API 路由（必须在静态托管之前注册）===
app.get('/api/awards', (req, res) => {
  try {
    res.json(readData());
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
});

app.post('/api/awards', (req, res) => {
  try {
    const data = readData();
    data.push(req.body);
    writeData(data);
    res.json({ success: true, message: '数据提交成功' });
  } catch (error) {
    res.status(500).json({ error: '提交数据失败' });
  }
});

app.put('/api/awards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    const index = data.findIndex(item => item.id === parseInt(id));
    if (index === -1) return res.status(404).json({ error: '记录不存在' });
    data[index] = req.body;
    writeData(data);
    res.json({ success: true, message: '数据更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新数据失败' });
  }
});

app.delete('/api/awards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = readData();
    const index = data.findIndex(item => item.id === parseInt(id));
    if (index === -1) return res.status(404).json({ error: '记录不存在' });
    data.splice(index, 1);
    writeData(data);
    res.json({ success: true, message: '数据删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除数据失败' });
  }
});

// === 托管前端静态文件 ===
app.use(express.static(__dirname));
app.get('/', (req, res) => res.redirect('/index.html'));

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`数据文件: ${DATA_FILE}`);
});
