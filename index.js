#!/usr/bin/env node

const cmdr = require('commander');
const fs = require('fs');
const path = require('path');
const admZip = require('adm-zip');
// const feed = require('feed');
const feed = require('rss');
const chalk = require('chalk');
const toXml = require('jstoxml');

// cmdr.option('-c --create','Parses through a specified directory and creates a feed.xml file from the existing Citrix script packages.')
// .option('-d --directory <path>','Specifies the directory to parse.')
// .option('-t --type <type>','Specifies the access type (FILE,HTTP')
// .option('-s --baseurl <base url>','Specifies the base FILE/HTTP URL for the VSIX files')
// .parse(process.argv);

// console.log(cmdr);

let createFunction = (options) => {
    //console.log(options);
    
    if (options.directory == null)
    {
        console.log(chalk.red('Please pass in the --directory parameter'));
        return;
    }
    if (options.type == null)
    {
        console.log(chalk.red('Please pass in the --type parameter. It should be FILE or HTTP.'));
        return;
    }
    if (options.baseurl == null)
    {
        console.log(chalk.red('Please pass in the --baseurl parameter.'));
        return;
    }
    
    if (options.exporttype == null || 
        (options.exporttype.toLowerCase() != 'json' &&
        options.exporttype.toLowerCase() != 'rss'))
    {
        console.log(chalk.red('Please pass in the --exporttype parameter. It should be RSS or JSON.'));
        return;
    }

    if ( options.type.toLowerCase() == 'file' && options.baseurl == '.')
    { 
        options.baseurl = path.resolve(options.baseurl);
    }

    let xmlOptions = {
        header: true,
        indent: '  '
    };
    let rssFeed = {
        _name: 'rss',
        _attrs: {
            version: '2.0'
        },
        _content: {
            channel: [
                {
                    title: 'Citrix Script packages',
                    description: 'Custom feed for Citrix Script packages',
                    link: 'http://developer.citrix.com'
                }
            ]
        }
    };

   
   

    // let feedOptions = {
    //     title: 'Citrix Script packages',
    //     description: 'Custom feed for Citrix Script packages',
    //     link: 'http://developer.citrix.com'
    // };

    // let vsixFeed = new feed(feedOptions);
    // fs.writeFileSync('./feed.xml',vsixFeed.xml());
    // return;
    
    //check to make sure that directory is passed in...
    fs.readdirSync(options.directory).forEach( (file) => {
        //make sure extension is vsix
        
        var ext = path.extname(file);
        
        if ( ext == '.vsix')
        {
            let fullPath = path.resolve(file);
            
            let zip = new admZip(fullPath);

            zip.getEntries().forEach(function(entry) {
                var entryName = entry.entryName;
                console.log(entryName);
                
                if ( entryName.indexOf('manifest.json') != -1 )
                {
                    var newVsixItem = {};
                    newVsixItem.item = {};

                    console.log(zip.readAsText(entry));
                    let manifest = JSON.parse(zip.readAsText(entry));

                    newVsixItem.item.title = `${manifest.packageName}`;

                    newVsixItem.item.description = `${manifest.packageDescription}`;

                    // let itemInfo = {
                    //     title:`${manifest.packageName}`,
                    //     description: `${manifest.packageDescription}`
                    // };

                    switch (options.type.toLowerCase()) {
                        case "file":
                            newVsixItem.item.link = `file://${options.baseurl}${file}`;
                            break;
                        case "http":
                            newVsixItem.item.link= `http://${options.baseurl}${file}`;
                            break;
                        case "https":
                            newVsixItem.item.link = `https://${options.baseurl}${file}`;
                            break;
                        default:
                            console.log(chalk.red('Unknown type parameter...'));
                            return;
                    }
                    rssFeed._content.channel.push(newVsixItem);
                    //let feedItem = vsixFeed.item(itemInfo); //vsixFeed.addItem(itemInfo);
                }
                
            });
        }
    });
    // let a = toXml.toXML(rssFeed, xmlOptions);
    // console.log(a);
    // return;

    switch (options.exporttype.toLowerCase()) {
        case "json":
            //fs.writeFileSync('./feed.json',vsixFeed.json1());
            break;
        case "rss":
            fs.writeFileSync('./feed.xml',toXml.toXML(rssFeed, xmlOptions));
            break;
        default:
            break;
    }
    
};

cmdr.version('1.0.0')
.command('create')
.description('Creates a RSS feed xml based on a directory of .vsix files')
.option('-d --directory <path>','Directory to parse where Citrix script packages are stored.')
.option('-t --type <type>','Specifies the access type (FILE,HTTP')
.option('-s --baseurl <base url>','Specifies the base FILE/HTTP URL for the VSIX files')
.option('-e --exporttype [export type]','Specifies the export type, JSON,RSS,ATOM')
.action(createFunction);

cmdr.parse(process.argv);