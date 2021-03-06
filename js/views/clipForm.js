define(['./Container', '../3DGIS/CrossClip', '../3DGIS/BoxClip', '../3DGIS/PlaneClip', '../3DGIS/PolygonClip'], function (Container, CrossClip, BoxClip, PlaneClip, PolygonClip) {
    "use strict";
    var _ = require('underscore');
    var $ = require('jquery');
    var viewer;
    var parent;
    var sceneModel;
    var isPCBroswer;

    var htmlStr = [
        '<main style="position : absolute;" class="mainView">',
            '<button type="button" style="top: 10px;position: absolute;left: 90%;background-color: rgba(38, 38, 38, 0.75);" aria-label="Close"  id="closeScene" class="myModal-close" title="关闭"><span aria-hidden="true">×</span></button>',
            '<input id="clipTab1" type="radio" name="clipTab" checked>',
            '<label for="clipTab1" style="font-size: 13px">' + Resource.BoxClip + '</label>',
            '<input id="clipTab2" type="radio" name="clipTab">',
            '<label for="clipTab2" style="font-size: 13px">' + Resource.PlaneClip + '</label>',
            '<input id="cross-clip-panel-radio" type="radio" name="clipTab">',
            '<label for="cross-clip-panel-radio" id="cross-clip-panel-label" style="font-size: 13px">' + Resource.CrossClip + '</label>',
            '<input id="polygon-clip-panel-radio" type="radio" name="clipTab">',
            '<label for="polygon-clip-panel-radio" style="font-size: 13px">' + Resource.PolygonClip + '</label>',
            '<section id="clipContent1" class="params-window-content">',
                '<div class="ui raised segment" style="margin: 10px; background: #3b4547">',
                    '<div>',
                        '<a class="ui blue ribbon label">' + Resource.parameterSetting + '</a><br>',
                        '<p><span>' + Resource.length + '</span><input type="number" id="box-clip-length" class="input clip-input" min="0" step="1" value="10"><span>&nbsp;米</span></p>',
                        '<p><span>' + Resource.width + '</span><input type="number" id="box-clip-width" class="input clip-input" min="0" step="1" value="10"><span>&nbsp;米</span></p>',
                        '<p><span>' + Resource.height + '</span><input type="number" id="box-clip-height" class="input clip-input" min="0" step="1" value="10"><span>&nbsp;米</span></p>',
                        '<p><span>' + Resource.rotate + '</span><input type="number" id="box-clip-rotate" class="input clip-input" min="-180" max="180" step="1" value="0"><span>&nbsp;度</span></p>',
                        '<a class="ui teal ribbon label">' + Resource.ClipModel + '</a><br><br>',
                        '<select id="box-clip-mode" class="cesium-button" style="font-size: 12px;margin: 0px 0px -5px 0px;width: 90%">',
                            '<option value="clip_behind_all_plane_without_line_frame" selected>' + Resource.CutInsideBoxNOFrame + '</option>',
                            '<option value="clip_behind_any_plane_without_line_frame">' + Resource.CutOutBoxNOFrame + '</option>',
                            '<option value="clip_behind_all_plane_with_line_frame">' + Resource.CutInsideBoxFrame + '</option>',
                            '<option value="clip_behind_any_plane_with_line_frame">' + Resource.CutOutBoxFrame + '</option>',
                        '</select><br/><br/>',
                        '<div>',
                            '<input type="button" id="clear-box-clip" class="btn btn-info" style="float:right" value="清除">',
                            '<input type="button" id="box-clip-analysis" class="btn btn-info" style="float:right" value="分析">',
                        '</div>',
                    '</div>',
                '</div>',
            '</section>',
            '<section id="clipContent2">',
                '<div class="adaptation">',
                    '<div class="ui raised segment" style="margin: 10px; background: #3b4547 ">',
                        '<a class="ui blue ribbon label">' + Resource.firstPoint + '</a>',
                        '<p><span>' + Resource.Spacelongitude + '</span><input type="number" id="plane-clip-point1-longitude" class="input clip-input" min="-180" max="180" step="0.0001" value="0" size="5"><span>&nbsp;度</span></p>',
                        '<p><span>' + Resource.Spacelatitude + '</span><input type="number" id="plane-clip-point1-latitude" class="input clip-input" min="-180" max="180" step="0.0001" value="0" size="5"><span>&nbsp;度</span></p>',
                        '<p><span>' + Resource.Spacealtitude + '</span><input type="number" id="plane-clip-point1-height" class="input clip-input" step="1" value="0" size="5"><span>&nbsp;米</span></p>',
                        '<a class="ui teal ribbon label clip-label">' + Resource.secondPoint + '</a>',
                        '<p><span>' + Resource.Spacelongitude + '</span><input type="number" id="plane-clip-point2-longitude" class="input clip-input" min="-180" max="180" step="0.0001" value="0" size="5"><span>&nbsp;度</span></p>',
                        '<p><span>' + Resource.Spacelatitude + '</span><input type="number" id="plane-clip-point2-latitude" class="input clip-input" min="-180" max="180" step="0.0001" value="0" size="5"><span>&nbsp;度</span></p>',
                        '<p><span>' + Resource.Spacealtitude + '</span><input type="number" id="plane-clip-point2-height" class="input clip-input" step="1" value="0" size="5"><span>&nbsp;米</span></p>',
                        '<a class="ui green ribbon label">' + Resource.thirdPoint + '</a>',
                        '<p><span>' + Resource.Spacelongitude + '</span><input type="number" id="plane-clip-point3-longitude" class="input clip-input" min="-180" max="180" step="0.0001" value="0" size="5"><span>&nbsp;度</span></p>',
                        '<p><span>' + Resource.Spacelatitude + '</span><input type="number" id="plane-clip-point3-latitude" class="input clip-input" min="-180" max="180" step="0.0001" value="0" size="5"><span>&nbsp;度</span></p>',
                        '<p><span>' + Resource.Spacealtitude + '</span><input type="number" id="plane-clip-point3-height" class="input clip-input" step="1" value="0" size="5"><span>&nbsp;米</span></p>',
                        '<button id="clear-plane-clip" class="btn btn-info" style="float:right">' + Resource.eliminate + '</button>',
                        '<button id="plane-clip-analysis" class="btn btn-info" style="float:right">' + Resource.analyze + '</button>',
                    '</div>',
                '</div>',
            '</section>',
            '<section id="cross-clip-panel">',
                '<div class="adaptation">',
                    '<div class="ui raised segment" style="margin: 10px; background: #3b4547 ">',
                        '<a class="ui blue ribbon label">参数设置</a>',
                        '<p><span>裁剪宽度：</span><input type="number" id="cross-clip-width" class="input clip-input" min="1" max="100" step="1" value="5"><span>&nbsp;米</span></p>',
                        '<p><span>裁剪高度：</span><input type="number" id="cross-clip-height" class="input clip-input" min="1" max="100" step="1" value="5"><span>&nbsp;米</span></p>',
                        '<p><span>绕X轴：</span><input type="number" id="cross-clip-pitch" class="input clip-input" min="0" max="360" step="1" value="0"><span>&nbsp;度</span></p>',
                        '<p><span>绕Y轴：</span><input type="number" id="cross-clip-roll" class="input clip-input" min="0" max="360" step="1" value="0"><span>&nbsp;度</span></p>',
                        '<p><span>绕Z轴：</span><input type="number" id="cross-clip-heading" class="input clip-input" min="0" max="360" step="1" value="0"><span>&nbsp;度</span></p>',
                        '<p><span>拉&nbsp&nbsp伸：</span><input type="number" id="cross-clip-extrude" class="input clip-input" min="1" max="30" step="1" value="1"><span>&nbsp;米</span></p>',
                        '<div>',
                            '<button id="clear-cross-clip" class="btn btn-info" style="float:right">清除</button>',
                            '<button id="choose-cross-clip-pos" class="btn btn-info" style="float:right">分析</button>',
                        '</div>',
                    '</div>',
                '</div>',
            '</section>',
            '<section id="polygon-clip-panel">',
                '<div class="adaptation">',
                    '<div class="ui raised segment" style="margin: 10px; background: #3b4547 ">',
                        '<a class="ui blue ribbon label">参数设置</a>',
                        '<select id="polygon-clip-mode" class="cesium-button" style="font-size: 12px;margin: 0px 0px -5px 0px;width: 90%">',
                            '<option value="polygon-clip-outside" selected>' + Resource.PolygonClipOutside + '</option>',
                            '<option value="polygon-clip-inside">' + Resource.PolygonClipInside + '</option>',
                        '</select><br/><br/>',
                        '<div>',
                            '<button id="clear-polygon-clip" class="btn btn-info" style="float:right">清除</button>',
                            '<button id="choose-polygon-clip-pos" class="btn btn-info" style="float:right">分析</button>',
                        '</div>',
                    '</div>',
                '</div>',
            '</section/>',
        '</main>'
    ].join('');
    var clipForm = Container.extend({
        tagName: 'div',
        id: 'sceneAttribute',
        events: {
            'click #closeScene': 'onCloseSceneClk',
            'click #plane-clip-analysis': 'onPlaneClip',
            'click #clear-plane-clip': 'onClearPlaneClip',
            'click #box-clip-analysis': 'onBoxClip',
            'click #clear-box-clip': 'onClearBoxClip',
            'click #choose-cross-clip-pos': 'onCrossClip',
            'click #clear-cross-clip': 'onClearCrossClip',
            'click #choose-polygon-clip-pos': 'onPolygonClip',
            'click #clear-polygon-clip': 'onClearPolygonClip',
            'change input[type=file]': 'onInputChange'
        },
        template: _.template(htmlStr),
        initialize: function (options) {
            sceneModel = options.sceneModel;
            viewer = options.sceneModel.viewer;
            parent = options.parent;
            isPCBroswer = options.isPCBroswer;
            this.render();
            this.on('componentAdded', function (parent) {
                $('main').each(function (index) {
                    $(this).myDrag({
                        parent: 'body',
                        randomPosition: false,
                        direction: 'all',
                        handler: false,
                        dragStart: function (x, y) {
                        },
                        dragEnd: function (x, y) {
                        },
                        dragMove: function (x, y) {
                        }
                    });
                });
            });
            /*if (sceneModel.analysisObjects.planeClipStore) {
                clip.initializing(viewer, sceneModel, true, isPCBroswer);
            }
            if (sceneModel.analysisObjects.boxClipStore) {
                clip.initializing(viewer, sceneModel, false, isPCBroswer);
            }*/
        },
        render: function () {
            this.$el.html(this.template());
            return this;
        },
        onCloseSceneClk: function (evt) {
            this.$el.hide();
            BoxClip.destroy(viewer);
            PlaneClip.destroy(viewer);
            CrossClip.destroy(viewer);
            PolygonClip.destroy();
        },
        onPlaneClip: function (evt) {
            PlaneClip.startClip(viewer, isPCBroswer);
            if (!isPCBroswer) {
                this.$el.hide();
            }
        },
        onClearPlaneClip: function (evt) {
            PlaneClip.clear(viewer);
        },
        onBoxClip: function (evt) {
            BoxClip.startClip(viewer);
            if (!isPCBroswer) {
                this.$el.hide();
            }
        },
        onClearBoxClip: function (evt) {
            BoxClip.clear();
        },
        onCrossClip: function(){
            CrossClip.startClip(viewer);
            if (!isPCBroswer) {
                this.$el.hide();
            }
        },
        onClearCrossClip: function(){
            CrossClip.clear();
        },
        onPolygonClip: function(){
            PolygonClip.startClip(viewer);
            if (!isPCBroswer) {
                this.$el.hide();
            }
        },
        onClearPolygonClip: function(){
            PolygonClip.clear();
        }
    });
    return clipForm;
});
