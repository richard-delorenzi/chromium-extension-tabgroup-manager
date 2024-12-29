async function show_tabGroups(){
    const groups = await chrome.windows.getAll({
    });
    
    const template = document.getElementById('li_template');
    const elements = new Set();
    for (const group of groups) {
        const element = template.content.firstElementChild.cloneNode(true);  
        element.querySelector('.content').textContent = JSON.stringify(group);
        element.querySelector('a').addEventListener('click', async () => {        
        });
        elements.add(element);
    }
    document.querySelector('ul#output-list').append(...elements);
}
    
function enable_button(){
    const button = document.querySelector('button');
    button.addEventListener('click', async () => {
        document.querySelector('p#notes').textContent = "you clicked the button";
    });
}

await show_tabGroups();
enable_button();
