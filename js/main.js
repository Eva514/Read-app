/**
 * Created by eva on 2016/11/29.
 */
(function(){
    'use strict';//声明严格模式，以便使用ES6语法

    //封装localStorage方法以及JSONP
    var Util = (function(){
        //防止localStorage中key被覆盖，给其增加一个前缀
        var prefix = 'fiction_reader_';
        var StorageGetter = function(key){
            return localStorage.getItem(prefix + key);
        };
        var StorageSetter = function (key, val) {
            return localStorage.setItem(prefix + key, val);
        };

        //数据解密
        var getJSONP = function (url, callback) {
            return $.jsonp({
                url: url,
                cache: true,
                callback: 'duokan_fiction_chapter',
                success: function(result){
                    var data = $.base64.decode(result);//解码
                    //decodeURIComponent()函数可对encodeURIComponent()函数编码过的URI进行解码.escape() 函数可对字符串进行编码
                    var json = decodeURIComponent(escape(data));
                    callback(json);
                }
            })
        };

        return {
            getJSONP: getJSONP,
            StorageGetter: StorageGetter,
            StorageSetter: StorageSetter
        }
    })();

    //DOM节点缓存
    var Dom = {
        top_nav: $('#top_nav'),
        fiction_chapter_title: $('#fiction_chapter_title'),
        font_container: $('.font_container'),
        large_font: $('#large_font'),
        small_font: $('#small_font'),
        bottom_nav: $('.bottom_nav'),
        menu_btn: $('#menu_btn'),
        font_btn: $('#font_btn'),
        night_btn: $('#night_btn'),
        day_btn: $('#day_btn'),

    };
    var Win = $(window);
    var Doc = $(document);
    var FictionContainer = $('#fiction_container');
    var NightMode = false; //用来判断是否是夜间模式
    var readerModel;
    var readerUI;

    //字体设置信息
    var initFontSize = Util.StorageGetter('font_size');//若localStorage保存有initFontSize，则取出该值
    initFontSize = parseInt(initFontSize);//转换成int类型

    if(!initFontSize){
        initFontSize = 16;//若localStorage没有initFontSize，则作出初始化
    }
    FictionContainer.css('font-size', initFontSize);

    //背景颜色表
    var colorArr = [
        {
            value: '#f7eee5',
            name: '米白',
            font: ''
        },
        {
            value: '#e9dfc7',
            name: '纸张',
            font: '',
            id: 'font_normal'
        },
        {
            value: '#a4a4a4',
            name: '浅灰',
            font: ''
        },
        {
            value: '#cdefce',
            name: '护眼',
            font: ''
        },
        {
            value: '#283548',
            name: '灰蓝',
            font: '#7685a2',
            bottomColor : '#fff'
        },
        {
            value: '#0f1410',
            name: '夜间',
            font: '#4e534f',
            bottomColor : 'rgba(255,255,255,0.7)',
            id : "font_night"
        }
    ];

    //背景颜色
    var tool_bar = Util.StorageGetter('toolbar_bk_color');
    var bottomColor = Util.StorageGetter('bottom_color');
    var color = Util.StorageGetter('background_color');
    var font = Util.StorageGetter('font_color');
    var bkCurColor = Util.StorageGetter('background_color');
    var fontColor = Util.StorageGetter('font_color');

    for(var i = 0;i<colorArr.length;i++){
        var display = 'none';
        if (bkCurColor == colorArr[i].value) {
            display = '';
        }
        $('#bk_container').append('<div class="bk-container" id="'+ colorArr[i].id+'" data-font="'+ colorArr[i].font+'" data-bottomColor="'+ colorArr[i].bottomColor+'" data-color="'+ colorArr[i].value+'" style="background: '+colorArr[i].value+'">'
                                   +'<div class="bk-container-current" style="display:'+display+'"></div></div>')
    }

    if(bottomColor){
        $('#bottom_tool_bar_ul').find('li').css('color', bottomColor);
    }
    if(color){
        $('body').css('background-color', color);
    }
    if(font){
        $('.m-read-content').css('color', font);
    }
    if(fontColor == '#4e534f'){
        NightMode = false;
        Dom.night_btn.show();
        Dom.day_btn.hide();
        $('#bottom_tool_bar_ul').css('opacity', '0.6');
    }

    //整个项目的入口函数
    function main(){
        //调用EventHandler
        readerModel = ReaderModel();
        readerUI = ReaderBaseFrame(FictionContainer);
        readerModel.init(function(data){
            readerUI(data);
        });
        EventHandler();
    }

    //实现和阅读器相关的数据交互的方法
    function ReaderModel(){
        var Chapter_id;
        var ChapterTotal;

        var init = function(UIcallback){
            getFictionInfo(function(){
                getCurChapterContent(Chapter_id,function(data){
                    //
                    UIcallback && UIcallback(data)
                })
            });

        /*    getFictionInfoPromise().then(function(d){
                return getCurChapterContentPromise();
            }).then(function(data){
                UIcallback && UIcallback(data);
            });*/
        };
        //获取小说章节信息，比如id
        var getFictionInfo = function(callback){
            $.get('data/chapter.json', function(data){
                //获取小说章节信息后的回调
                Chapter_id = Util.StorageGetter('current_chapter_id');
                if(Chapter_id == null){
                    Chapter_id = data.chapters[1].chapter_id;
                }
                ChapterTotal = data.chapters.length;
                callback && callback();
            }, 'json')
        };
    /*    var getFictionInfoPromise = function(){
            return new Promise(function(resolve, reject){
                if(data.result == 0){
                    $.get('data/chapter.json', function(data){
                        //获取小说章节信息后的回调
                        Chapter_id = Util.StorageGetter('current_chapter_id');
                        if(Chapter_id == null){
                            Chapter_id = data.chapters[1].chapter_id;
                        }
                        ChapterTotal = data.chapters.length;
                        resolve();
                    }, 'json')
                }else{
                    reject();
                }
            });
        };*/

        //获取当前章节的内容
        var getCurChapterContent = function(chapter_id, callback){
            $.get('data/data'+chapter_id+'.json', function(data){
                if(data.result == 0){
                    var url = data.jsonp;
                    Util.getJSONP(url, function(data){
                        callback && callback(data);
                    })
                }
            }, 'json')
        };

     /*   var getCurChapterContentPromise = function(){
         return new Promise(function(resolve, reject){
         $.get('data/data'+chapter_id+'.json', function(data){
         if(data.result == 0){
         var url = data.jsonp;
         Util.getJSONP(url, function(data){
         resolve(data);
         })
         }else{
         reject({msg: 'failed'});
         }
         }, 'json')
         })
         };*/

        //翻页功能，上一章
        var prevChapter = function(UIcallback){
            Chapter_id = parseInt(Chapter_id, 10);
            if(Chapter_id == 0){
                return;
            }
            Chapter_id -= 1;
            getCurChapterContent(Chapter_id, UIcallback);
            Util.StorageSetter('current_chapter_id', Chapter_id);
        };
        //下一章
        var nextChapter = function(UIcallback){
            Chapter_id = parseInt(Chapter_id, 10);
            if(Chapter_id == ChapterTotal){
                return;
            }
            Chapter_id += 1;
            getCurChapterContent(Chapter_id, UIcallback);
            Util.StorageSetter('current_chapter_id', Chapter_id);
        };

        return {
            init: init,
            prevChapter: prevChapter,
            nextChapter: nextChapter
        }
    }

    //界面初始化，渲染基本的UI结构
    function ReaderBaseFrame(container){
        //解析章节数据
        function parseChapterData(jsonData){
            var jsonObj = JSON.parse(jsonData);
            var html = '<h4>' + jsonObj.t + '</h4>';
            for(var i = 0;i < jsonObj.p.length;i++){
                html += '<p>' + jsonObj.p[i] + '</p>';
            }
            return html;
        }

        return function(data){
            container.html(parseChapterData(data));
        }
    }

    //交互的事件绑定
    function EventHandler(){
        //控制上下菜单栏的显示与隐藏
        $('#action_mid').click(function () {
            if(Dom.top_nav.css('display') == 'none'){
                Dom.top_nav.show();
                Dom.bottom_nav.show();
            }else{
                Dom.top_nav.hide();
                Dom.bottom_nav.hide();
                Dom.font_container.hide();
                Dom.font_btn.removeClass('current');
            }
        });

        //滚动时隐藏上下菜单栏
        Win.scroll(function () {
            Dom.top_nav.hide();
            Dom.bottom_nav.hide();
            Dom.font_container.hide();
            Dom.font_btn.removeClass('current');
        });

        //字体面板的控制
        Dom.font_btn.click(function(){
            if(Dom.font_container.css('display') == 'none'){
                Dom.font_container.show();
                Dom.font_btn.addClass('current');
            }else{
                Dom.font_container.hide();
                Dom.font_btn.removeClass('current');
            }
        });

        //字体大小按钮的控制
        $('#large_font').click(function(){
            //对字体大小的上限做控制
            if(initFontSize > 20){
                return;
            }
            initFontSize += 1;
            FictionContainer.css('font-size', initFontSize);

            //对修改后的样式作保存，下次登录保持修改后的样式
            Util.StorageSetter('font_size', initFontSize);
        });
        $('#small_font').click(function(){
            //对字体大小的下限做控制
            if(initFontSize < 12){
                return;
            }
            initFontSize -= 1;
            FictionContainer.css('font-size', initFontSize);

            //对修改后的样式作保存，下次登录保持修改后的样式
            Util.StorageSetter('font_size', initFontSize);
        });

        //背景颜色按钮的控制
        $('#bk_container').delegate('.bk-container', 'click' ,function(){
            var color = $(this).data('color');
            var font = $(this).data('font');
            var bottomColor = $(this).data('bottomColor');
            var tool_bar = font;

            $('#bk_container').find('.bk-container-current').hide();
            $(this).find('.bk-container-current').show();

            if(!font){
                font = '#555';
            }
            if (!tool_bar) {
                tool_bar = '#fbfcfc';
            }

            if(bottomColor && bottomColor != "undefined"){
                $('#bottom_tool_bar_ul').find('li').css('color', bottomColor);
            }else{
                $('#bottom_tool_bar_ul').find('li').css('color', '#fff');
            }
            $('body').css('background-color', color);
            $('.m-read-content').css('color', font);

            Util.StorageSetter('toolbar_bk_color', tool_bar);
            Util.StorageSetter('bottom_color', bottomColor);
            Util.StorageSetter('background_color', color);
            Util.StorageSetter('font_color', font);

            var fontColor = Util.StorageGetter('font_color');
            if(fontColor == '#4e534f'){
                NightMode = false;
                Dom.night_btn.show();
                Dom.day_btn.hide();
                $('#bottom_tool_bar_ul').css('opacity', '0.6');
            }else{
                Dom.day_btn.show();
                Dom.night_btn.hide();
                NightMode =true;
                $('#bottom_tool_bar_ul').css('opacity', '0.9');
            }
        });

        //夜间白天阅读模式的切换
        $('#switch_day_night_btn').click(function () {
            if(NightMode){
                Dom.night_btn.show();
                Dom.day_btn.hide();
                $('#font_night').trigger('click');
                NightMode = false;
            }else{
                Dom.day_btn.show();
                Dom.night_btn.hide();
                $('#font_normal').trigger('click');
                NightMode =true;
            }
        });

        //翻页按钮的控制
        $('#prev_button').click(function(){
            //获得章节的翻页数据 -> 将数据拿出来渲染
            readerModel.prevChapter(function(data){
                readerUI(data);
            });
        });
        $('#next_button').click(function(){
            readerModel.nextChapter(function(data){
                readerUI(data);
            })
        });
    }


    main();

})();