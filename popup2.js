function show({datas, heading}={}){
    const template = document.getElementById('template');
    const li_template = document.getElementById('li_template');
    
    const section = template.content.cloneNode(true);
    section.querySelector('#heading').textContent = heading;
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
show({datas:groups,heading:"Tab Groups"});

const windows = await chrome.windows.getAll({populate:true});
show({datas:windows,heading:"Windows"});

const current_window= await chrome.windows.getCurrent();
document.querySelector('#output').append(`current window id: ${current_window.id}`);

enable_button();

