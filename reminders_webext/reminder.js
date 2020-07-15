const idPrefix = 'queIt_';
const ele = {
  dateHolder: document.getElementById('dateHolder'),
  save: document.getElementById('save'),
  hidden: document.getElementById('hidden'),
  cancel: document.getElementById('cancel'),
  new: document.getElementById('newReminder'),
  edit: document.getElementById('editView'),
  timer: document.getElementById('timerView'),
  list: document.getElementById('listView'),
  historylist: document.getElementById('listViewO'),
  title: document.querySelector('[name="title"]'),
  desc: document.querySelector('[name="desc"]'),
  time: document.querySelector('[name="time"]'),
  date: document.querySelector('[name="date"]'),
  daily: document.querySelector('[name="daily"]'),
  id: document.querySelector('[name="id"]'),
  cList: document.getElementById('listViewULC'),
  oList: document.getElementById('listViewULO'),
  history: document.getElementById('history'),
  back: document.getElementById('back'),
  overlay: document.getElementById('overlay'),
  closeAlert: document.getElementById('closeAlert'),
  alertTxt: document.getElementById('alertTxt'),
  timer: document.getElementById('time'),
}
// const showTimer = document.getElementById('getTime');
// const holder = current ? ele.timer;
// data.forEach(d => {
//   if (current )
// })

var myVar = setInterval(myTimer, 1000);

function myTimer() {
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var dateTime = date+ " " + today.toLocaleTimeString()
  document.getElementById("time").innerHTML = dateTime;
}


const showAlert = msg => {
  ele.alertTxt.textContent = msg;
  ele.overlay.classList.remove('hidden');
}

const closeAlert = () => {
  ele.alertTxt.textContent = '';
  ele.overlay.classList.add('hidden');
}

const makeList = (data = [], current = true) => {
  if (current) {
    while (ele.cList.children.length > 0) {
      ele.cList.firstChild.remove();
    }
  } else {
    while (ele.oList.children.length > 0) {
      ele.oList.firstChild.remove();
    }
  }

  const template = document.getElementById('listitem');
  const holder = current ? ele.cList : ele.oList;
  data.forEach(d => {
    if (current && d.done) return;
    if (!current && !d.done) return;
    const item = document.importNode(template.content, true);
    item.querySelector('.lTitle').textContent = d.title;
    item.querySelector('li').setAttribute('data-id', d.id)
    if (d.daily) item.querySelector('.daily').classList.remove('hidden');
    holder.appendChild(item);
  })
}

const changePage = mode => {
  switch (mode) {
    case 'list':
      browser.runtime.sendMessage({ action: 'list', data: { current: true } });
      ele.list.classList.remove('hidden');
      ele.edit.classList.add('hidden');
      ele.historylist.classList.add('hidden');
      break;
    case 'edit':
      ele.edit.classList.remove('hidden');
      ele.list.classList.add('hidden');
      ele.historylist.classList.add('hidden');
      break;
    case 'history':
      browser.runtime.sendMessage({ action: 'list', data: { current: false } });
      ele.historylist.classList.remove('hidden');
      ele.edit.classList.add('hidden');
      ele.list.classList.add('hidden');
      break;
  }
}

const saveReminder = () => {
  const data = {
    title: ele.title.value || 'No title',
    desc: ele.desc.value || '',
    rTime: ele.time.value,
    daily: ele.daily.checked,
    rDate: ele.date.value,
    id: ele.id.value,
  }
  if (!data.rTime || data.rTime == "") {
    showAlert("No time set");
    return;
  }
  if (!data.daily && (!data.rDate || data.rDate == "")) {
    showAlert("No Date set");
    return;
  }
  // send to BG
  browser.runtime.sendMessage({
    action: "create",
    data
  });
}

const handleItemClick = (current, e) => {
  if(e.target.hasAttribute('data-action')) {
    const action = e.target.getAttribute('data-action')
    const id = e.target.parentNode.getAttribute('data-id');
    switch(action) {
      case 'edit':
        changePage('edit');
        browser.runtime.sendMessage({
          action: "getreminder",
          data: { id, current }
        });
        break;
      case 'delete':
        browser.runtime.sendMessage({
          action: "delete",
          data: { id, current }
        });
        break
    }
  }
}

const handleDate = () => {
  if(!ele.daily.checked) {
    ele.dateHolder.classList.remove('hidden')
  } else {
    ele.dateHolder.classList.add('hidden')
  }
}

// Edit page setup
const setEdit = data => {
  ele.title.value = data.title;
  ele.desc.value = data.desc;
  ele.time.value = data.rTime;
  ele.date.value = data.rDate;
  ele.daily.checked = data.daily;
  ele.id.value = `${idPrefix}${data.ts}`;
  handleDate();
}

// New reminder setup
const emptyInputs = () => {
  document.querySelectorAll('input').forEach(i =>{
    i.value = '';
  });
  const now = new Date;
  ele.time.value = `${now.getHours()}:${now.getMinutes()}`
  ele.daily.checked = false;
  ele.desc.value = '';
  handleDate();
}


const handleMessage = ({action, data, current}) => {
  switch(action) {
    case 'list':
      const sortedData = Object.keys(data).map(k =>data[k]);
      makeList(sortedData, current);
      break;
    case 'create':
      changePage('list')
      break;
    case 'getreminder':
      setEdit(data)
      break;
  }
}

ele.cancel.addEventListener('click', ()=> changePage('list'));
ele.new.addEventListener('click', ()=> {
  emptyInputs();
  changePage('edit');
});
ele.history.addEventListener('click', ()=> changePage('history'));
ele.back.addEventListener('click', ()=> changePage('list'));
ele.cList.addEventListener('click', handleItemClick.bind(this, true));
ele.oList.addEventListener('click', handleItemClick.bind(this, false));
ele.save.addEventListener('click', saveReminder);
ele.daily.addEventListener('click', handleDate);
ele.closeAlert.addEventListener('click', closeAlert);

browser.runtime.onMessage.addListener(handleMessage);

changePage('list');
