define(['Cesium', 'spectrum', 'drag'], function (Cesium) {
    'use strict';

    var viewshed = function () {
    };
    var viewshed3D;
    var point;
    var vsPointHandler;
    var clickFlag = 0;
    var clickCount = 0;
    viewshed.remove = function (viewer) {
        var scene = viewer.scene;
        scene.viewFlag = true;
        if (vsPointHandler) {
            vsPointHandler && vsPointHandler.clear();
            vsPointHandler.deactivate();
        }
        if (viewshed3D) {
            viewshed3D.destroy();
            viewshed3D = undefined;
        }

        $('#viewX').val('0.0');
        $('#viewY').val('0.0');
        $('#viewZ').val('0.0');
        $('#direction').val('0.0');
        $('#viewshed-pitch').val('0.0');
        $('#distance').val('1.0');
        $('#horizontalFov').val('90');
        $('#verticalFov').val('60');
    };

    viewshed.initializing = function (viewer, sceneModel, isPCBroswer) {
        var scene = viewer.scene;
        clickFlag += 1;
        clickCount = 0;
        if (!viewshed3D) {
            viewshed3D = new Cesium.ViewShed3D(scene);
        }
        vsPointHandler && vsPointHandler.clear();
        viewshed3D.distance = 0.1;
        var store = {};
        $("#clearVS").click(function () {
            /*vsPointHandler && vsPointHandler.clear();
             viewshed3D.distance = 0.1;
             vsPointHandler.deactivate();*/
            viewshed.remove(viewer);
        });

        $('#viewX').on('input propertychange', viewCoordChange);
        $('#viewY').on('input propertychange', viewCoordChange);
        $('#viewZ').on('input propertychange', viewCoordChange);

        function viewCoordChange() {
            if ($('#viewX').val() === "") {
                $('#viewX').val("0.0")
            }
            if ($('#viewY').val() === "") {
                $('#viewY').val("0.0")
            }
            if ($('#viewZ').val() === "") {
                $('#viewZ').val("0.0")
            }
            var cartesian = Cesium.Cartesian3.fromDegrees(parseFloat($('#viewX').val()), parseFloat($('#viewY').val()), parseFloat($('#viewZ').val()) + parseFloat($('#heightView').val()), Cesium.Ellipsoid.WGS84);
            point.position = cartesian;
            viewshed3D.viewPosition = [parseFloat($('#viewX').val()), parseFloat($('#viewY').val()), parseFloat($('#viewZ').val()) + parseFloat($('#heightView').val())];
        }

        $('#heightView').on('input propertychange', function () {
            var longitude = parseFloat($('#viewX').val());
            var latitude = parseFloat($('#viewY').val());
            if (this.value === "") { // 避免删除导致崩溃
                this.value = "0.0";
            }
            var height = parseFloat($('#viewZ').val()) + parseFloat(this.value);
            var cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
            point.position = cartesian;
            viewshed3D.viewPosition = [longitude, latitude, height];
        });

        $('#distance').on('input propertychange', function () {
            if (Number(this.value) < 0.1) {
                $(this).val("0.1");
            }
            viewshed3D.distance = Number(this.value);
        });

        $('#viewshed-pitch').on('input propertychange', function () {
            if (this.value === "") {
                $(this).val("0");
            }
            viewshed3D.pitch = parseFloat(this.value);
        });

        $('#direction').on('input propertychange', function () {
            if (this.value === "") {
                $(this).val("0");
            }
            viewshed3D.direction = parseFloat(this.value);
        });

        $('#verticalFov').on('input propertychange', function () {
            if (Number(this.value) < 1) {
                $(this).val("1");
            }
            viewshed3D.verticalFov = parseFloat(this.value);
        });

        $('#horizonalFov').on('input propertychange', function () {
            if (Number(this.value) < 1) {
                $(this).val("1");
            }
            viewshed3D.horizontalFov = parseFloat(this.value);
        });

        // var visibleColor = document.getElementById('colorPicker1');
        // var color1 = Cesium.Color.fromCssColorString(visibleColor.value);
        // viewshed3D.visibleAreaColor = color1;
        // var hiddenColor = document.getElementById('colorPicker2');
        // var color2 = Cesium.Color.fromCssColorString(hiddenColor.value);
        // viewshed3D.hiddenAreaColor = color2;

        $('#colorPicker1').on('input propertychange', function () {
            var color = Cesium.Color.fromCssColorString(this.value);
            viewshed3D.visibleAreaColor = color;
        });

        $('#colorPicker2').on('input propertychange', function () {
            var color = Cesium.Color.fromCssColorString(this.value);
            viewshed3D.hiddenAreaColor = color;
        });

        $('#viewShedBody').change(function () {
            scene.primitives._primitives = [];
            var s3mInstanceColc = new Cesium.S3MInstanceCollection(scene._context);
            scene.primitives.add(s3mInstanceColc);
            var param = viewshed3D.getViewshedParameter();
            var geometryViewShedBodyPostParameter = {};
            geometryViewShedBodyPostParameter.viewerPoint = param.viewPosition;
            geometryViewShedBodyPostParameter.point3DsList = param.point3DList;
            geometryViewShedBodyPostParameter.radius = param.distance;
            geometryViewShedBodyPostParameter.lonlat = true;
            geometryViewShedBodyPostParameter.viewShedType = $(this).val();
            var url = "http://localhost:8090/iserver/services/spatialAnalysis-BIMFangWu/restjsr/spatialanalyst/geometry/3d/viewshedbody.json";
            var queryData = JSON.stringify(geometryViewShedBodyPostParameter);
            $.ajax({
                url: url,
                async: true,
                data: queryData,
                method: "POST"
            }).done(function (data) {
                $.ajax({
                    url: data.newResourceLocation + ".json",
                    method: "GET"
                }).done(function (data) {
                    if (data.geometry === null) {
                        return;
                    }
                    var uint8Array = new Uint8Array(data.geometry.model);
                    var buffer = uint8Array.buffer;
                    s3mInstanceColc.add("result", {
                        position: Cesium.Cartesian3.fromDegrees(data.geometry.position.x, data.geometry.position.y, data.geometry.position.z),
                        hpr: new Cesium.HeadingPitchRoll(0, 0, 0),
                        color: new Cesium.Color(0, 160 / 255, 233 / 255, 0.5)
                    }, buffer);
                })
            });

        });
        var viewPosition;
        scene.viewFlag = true;
        vsPointHandler = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Point, Cesium.ClampMode.Space);

        var vsHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        if(!isPCBroswer) {
            vsHandler.setInputAction(function(evt) {
                clickCount++;
                if(clickCount === 2) {
                    var endPosition = viewer.scene.pickPosition(evt.position);
                    var distance = Cesium.Cartesian3.distance(viewPosition, endPosition);
                    if (distance > 0) {
                        var cartographic = Cesium.Cartographic.fromCartesian(endPosition);
                        var longitude = Cesium.Math.toDegrees(cartographic.longitude);
                        var latitude = Cesium.Math.toDegrees(cartographic.latitude);
                        var height = cartographic.height;
                        viewshed3D.setDistDirByPoint([longitude, latitude, height]);
                    }
                    $('#direction').val(viewshed3D.direction);
                    $('#viewshed-pitch').val(viewshed3D.pitch);
                    $('#distance').val(viewshed3D.distance);
                    $('#horizontalFov').val(viewshed3D.horizontalFov);
                    $('#verticalFov').val(viewshed3D.verticalFov);

                    store.viewPosition = viewshed3D.viewPosition;
                    store.distance = viewshed3D.distance;
                    store.pitch = viewshed3D.pitch;
                    store.direction = viewshed3D.direction;
                    store.verticalFov = viewshed3D.verticalFov;
                    store.horizontalFov = viewshed3D.horizontalFov;
                    sceneModel.analysisObjects.viewshed3DStore = store;

                    vsHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }

        if(isPCBroswer) {
            vsHandler.setInputAction(function (e) {
                //若此标记为false，则激活对可视域分析对象的操作
                if (!scene.viewFlag) {
                    //获取鼠标屏幕坐标,并将其转化成笛卡尔坐标
                    var position = e.endPosition;
                    var last = scene.pickPosition(position);
                    //计算该点与视口位置点坐标的距离
                    var distance = Cesium.Cartesian3.distance(viewPosition, last);
                    if (distance > 0) {
                        var cartographic = Cesium.Cartographic.fromCartesian(last);
                        var longitude = Cesium.Math.toDegrees(cartographic.longitude);
                        var latitude = Cesium.Math.toDegrees(cartographic.latitude);
                        var height = cartographic.height;
                        viewshed3D.setDistDirByPoint([longitude, latitude, height]);
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }

        if(isPCBroswer) {
            vsHandler.setInputAction(function (e) {
                if (!scene.viewFlag) {
                    scene.viewFlag = true;
                    $('#direction').val(viewshed3D.direction);
                    $('#viewshed-pitch').val(viewshed3D.pitch);
                    $('#distance').val(viewshed3D.distance);
                    $('#horizontalFov').val(viewshed3D.horizontalFov);
                    $('#verticalFov').val(viewshed3D.verticalFov);
                }
                store.viewPosition = viewshed3D.viewPosition;
                store.distance = viewshed3D.distance;
                store.pitch = viewshed3D.pitch;
                store.direction = viewshed3D.direction;
                store.verticalFov = viewshed3D.verticalFov;
                store.horizontalFov = viewshed3D.horizontalFov;
                sceneModel.analysisObjects.viewshed3DStore = store;
                vsHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }

        vsPointHandler.drawEvt.addEventListener(function (result) {
            point = result.object;
            var position = result.object.position;
            viewPosition = position;
            var cartographic = Cesium.Cartographic.fromCartesian(position);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            var height = cartographic.height;
            $('#viewX').val(longitude.toFixed(4));
            $('#viewY').val(latitude.toFixed(4));
            $('#viewZ').val(height.toFixed(4));
            if (scene.viewFlag) {
                viewshed3D.viewPosition = [longitude, latitude, height];
                viewshed3D.build();
                scene.viewFlag = false;
            }
        });

        if (sceneModel.analysisObjects.viewshed3DStore && clickFlag < 2) {
            var store = sceneModel.analysisObjects.viewshed3DStore;
            viewshed3D.build();
            viewshed3D.viewPosition = store.viewPosition;
            viewshed3D.distance = store.distance;
            viewshed3D.pitch = store.pitch;
            viewshed3D.direction = store.direction;
            viewshed3D.verticalFov = store.verticalFov;
            viewshed3D.horizontalFov = store.horizontalFov;
        }
        vsPointHandler.activate();
    };
    return viewshed;
});