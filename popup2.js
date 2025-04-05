async function show_tabGroups(){
    const groups = await chrome.tabGroups.query({});
    
    const template = document.getElementById('li_template');
    const elements = new Set();
    const section_heading=document.createElement('h2');
    section_heading.textContent='Tab Groups';
    elements.add(section_heading);
    for (const group of groups) {
        const element = template.content.cloneNode(true);
        element.querySelector('.title').textContent = group.title;
        element.querySelector('.content').textContent = JSON.stringify(group);
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

