#!/usr/bin/env node

const cmdr = require('commander');
const fs = require('fs');
const path = require('path');
const admZip = require('adm-zip');
const feed = require('rss');
const chalk = require('chalk');
const toXml = require('jstoxml');
const url = require('url').URL;


let createFunction = (options) => {    
    if (options.directory == null)
    {
        console.log(chalk.red('Please pass in the --directory parameter'));
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

    if ( options.baseurl == '.')
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

                if ( entryName.indexOf('manifest.json') != -1 )
                {
                    console.log(`Found manifest file in VSIX (${file})`);
                    
                    var newVsixItem = {};
                    newVsixItem.item = {};

                    let manifest = JSON.parse(zip.readAsText(entry));

                    console.log('Getting file information...');

                    newVsixItem.item.title = `${manifest.packageName}`;

                    newVsixItem.item.description = `${manifest.packageDescription}`;

                    newVsixItem.item.author = manifest.author;

                    if ( options.baseurl.endsWith('/') )
                    {
                        newVsixItem.item.link = options.baseurl + file;
                    }
                    else
                    {
                        newVsixItem.item.link = options.baseurl + '/' + file;       
                    }
                    console.log('Adding VSIX to the rss feed');
                    
                    rssFeed._content.channel.push(newVsixItem);
                }
                
            });
        }
    });

    switch (options.exporttype.toLowerCase()) {
        case "json":
            //need to implement
            break;
        case "rss":
            fs.writeFileSync('./feed.rss',toXml.toXML(rssFeed, xmlOptions));
            console.log('Created rss feed');
            var feedUrl = new url(options.baseurl);
            
            switch (feedUrl.protocol.toLowerCase()) 
            {
                case 'file:':
                    console.log(chalk.green(`feed is available at ${feedUrl.protocol}//${feedUrl.host}/${path.resolve('feed.rss')}`));
                    break;
                case 'http:':
                    console.log(chalk.green(`feed is available at ${feedUrl.protocol}//${feedUrl.host}/feed.rss`));
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
};

cmdr.version('1.0.0')
.command('create')
.description('Creates a RSS feed xml based on a directory of .vsix files')
.option('-d --directory <path>','Directory to parse where Citrix script packages are stored.')
.option('-b --baseurl <base url>','Specifies the base FILE/HTTP URL for the VSIX files')
.option('-e --exporttype [export type]','Specifies the export type, RSS (currently)')
.action(createFunction);

cmdr.parse(process.argv);