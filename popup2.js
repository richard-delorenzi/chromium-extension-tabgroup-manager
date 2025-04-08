function PrettyJsonElementOf(obj){
    const result=document.createElement('pre');
    result.textContent=JSON.stringify(obj, null,2);
    return result;
}

function show({datas, heading}={}){
    const template = document.getElementById('template');
    const li_template = document.getElementById('li_template');
    
    const section = template.content.cloneNode(true);
    section.querySelector('#heading').textContent = heading;
    const output_list=section.querySelector('ul#output-list');
    for (const data of datas) {
        const element = li_template.content.cloneNode(true);
        element.querySelector('#title').textContent = data.title;
        element.querySelector('#content').replaceWith(
            PrettyJsonElementOf(data)
        );
        output_list.append(element);
    }
    
    document.querySelector('#output').append(section);
}

function isStoreWindow(window){
    const result = window.tabs.some(
        tab=> tab.url.endsWith("chrome-extensions/chrome-extension-1/flag.html" ));
    return result;
}

async function storeWindowId(){
    const windows = await chrome.windows.getAll({populate:true});
    const result = (
        windows
            .filter( window => isStoreWindow(window) )
            .map(window => window.id)
        [0] //assume only one
    );
    return result;
}
    
function enable_button(){
    const button = document.querySelector('button');
    button.addEventListener('click', async () => {
        document.querySelector('p#button-notes').textContent = "you clicked the button";
    });
}

const id=await storeWindowId();
document.querySelector('#output').append(
    PrettyJsonElementOf(id)
);

const groups = await chrome.tabGroups.query({});
show({datas:groups,heading:"Tab Groups"});

const windows = await chrome.windows.getAll({populate:true});
show({datas:windows,heading:"Windows"});

const current_window= await chrome.windows.getCurrent();
document.querySelector('#output').append(`current window id: ${current_window.id}`);

enable_button();

