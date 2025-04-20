# A chrome extension for managing tab-groups

## Introduction
Chrome already has tab-groups, so we ignore tabs, and let chrome do it's thing.

But we often have so many tab-groups that we need some help.
Chrome has a way to close tab-groups and bring them back. However the process is manual.
It would be nice to have a way to group tab-groups. That is what this extension does.

## Details
We are not storing tab-groups in a tree. Each tab-group can be in 0,1,several meta tab-groups.
However, we have not ruled out the idea of storing meta tab-groups in a tree. 

## Bugs and problems
The ability to close tabs and bring them back, would be a good back-end for this extension. However at present there is no API for it. So for now, we are storing hidden tabs in another window. The user will have to hide this other window (minimise, iconify, move to another desktop, or tell your window manager to un-map it).

## Licence
[Gnu GPL](https://www.gnu.org/licenses/gpl-3.0.en.html) — If you distribute copies of this program, then you must tell your users where you got it (all of the official sources below), and show them the licence.

https://bitbucket.org/davids_dad/chromium-extension-tabgroup-manager/src/main/
https://github.com/richard-delorenzi/chromium-extension-tabgroup-manager
