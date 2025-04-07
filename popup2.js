function show(datas){
    const template = document.getElementById('template');
    const li_template = document.getElementById('li_template');
    
    const section = template.content.cloneNode(true);
    section.querySelector('#heading').textContent = "tab datas";
    const output_list=section.querySelector('ul#output-list');
    for (const data of datas) {
        const element = li_template.content.cloneNode(true);
        element.querySelector('#title').textContent = data.title;
        element.querySelector('#content').textContent = JSON.stringify(data);
        output_list.append(element);
    }
    
    document.querySelector('#output').append(section);
}


    
function enable_button(){
    const button = document.querySelector('button');
    button.addEventListener('click', async () => {
        document.querySelector('p#notes').textContent = "you clicked the button";
    });
}

const groups = await chrome.tabGroups.query({});
show(groups);

await show_tabGroups();
enable_button();

