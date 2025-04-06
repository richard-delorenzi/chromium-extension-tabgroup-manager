async function show_tabGroups(){
    const groups = await chrome.tabGroups.query({});
    
    const li_template = document.getElementById('li_template');
    const elements = [];
    const section_heading=document.createElement('h2');
    section_heading.textContent='Tab Groups';
    elements.push(section_heading);
    for (const group of groups) {
        const element = li_template.content.cloneNode(true);
        element.querySelector('#title').textContent = group.title;
        element.querySelector('#content').textContent = JSON.stringify(group);
        elements.push(element);
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

