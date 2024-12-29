const groups = await chrome.windows.getAll({
});

const collator = new Intl.Collator();
//groups.sort((a, b) => collator.compare(a.title, b.title));

const template = document.getElementById('li_template');
const elements = new Set();
for (const group of groups) {
    const element = template.content.firstElementChild.cloneNode(true);

    //const title = group.title
    //const pathname = new URL(group.url).pathname.slice('/docs'.length);
    
    //element.querySelector('.title').textContent = JSON.stringify(windowTitle);
    element.querySelector('.content').textContent = JSON.stringify(group);
    element.querySelector('a').addEventListener('click', async () => {
        // need to focus window as well as the active group
        //await chrome.tabs.update(tab.id, { active: true });
        //await chrome.windows.update(group.windowId, { focused: true });
    });

    elements.add(element);
}
document.querySelector('ul#output-list').append(...elements);

function enable_button(){
    const button = document.querySelector('button');
    button.addEventListener('click', async () => {
        document.querySelector('p#notes').textContent = "you clicked the button";
    });
}

enable_button();
