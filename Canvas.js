var canvas = null;
var gl = null;
var bFullScreen = false;
var canvas_original_width;
var canvas_original_height;

// ---- WebGL Related Variables -----
const VertexAtrributeEnum =
{
    AMC_ATTRIBUTE_POSITION: 0,
    AMC_ATTRIBUTE_COLOR: 1
};

var shaderProgramObject = null;

// ---- Pyramid Variables ----
var vaoPyramid = null;
var vbo_position_pyramid = null;
var vbo_color_pyramid = null;

var anglePyramid = 0.0;

// ----- Cube Variables -----
var vaoCube = null;
var vbo_position_cube = null;
var vbo_color_cube = null;

var angleCube = 0.0;

var mvpMatrixUniform;
var perspectiveMatrixProjection;

var requestAnimationFrame =
    window.requestAnimationFrame || // For Chrome
    window.webkitRequestAnimationFrame || // For safari
    window.mozRequestAnimationFrame || // For mozilla
    window.oRequestAnimationFrame || // For Opera
    window.msRequestAnimationFrame; // For edge

// ---- main() ---
function main()
{
    // --- Get Canvas ---
    canvas = document.getElementById("PHKMesh");
    if (canvas == null) {
        console.log("Getting Canvas Failed\n");
    }
    else
    {
        console.log("Getting Canvas Succeeded\n");
    }

    // --- Set Canvas width and height for future use ----
    canvas_original_width = canvas.width;
    canvas_original_height = canvas.height;

    // ---- Register For Keyboard Events ----
    window.addEventListener("keydown", keyDown, false);

    // ---- Register For Mouse Event ----
    window.addEventListener("mousedown", mouseDown, false);

    window.addEventListener("resize", resize, false);

    initialize();

    resize();

    display();

}

function keyDown(event)
{
    // Code
    switch (event.keyCode)
    {
        case 81:
        case 113:
            uninitialize();
            window.close();
            break;
        case 70:
        case 102:
            toggleFullScreen();
            break;
    }
}

function mouseDown()
{
    
}

function toggleFullScreen()
{
    var fullScreen_element =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null;

    // --- If not full screen ----
    if (fullScreen_element == null) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        }
        else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen();
        }
        else if (canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen();
        }
        else if (canvas.msRequestFullscreen) {
            canvas.msRequestFullscreen();
        }
        bFullScreen = true;
    }
    else // ------- If already Full Screen -----
    {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        else if (document.msExitFullscreen)
        {
            document.msExitFullscreen();
        }
        bFullScreen = false;
    }

}

function initialize()
{
    // Code

    // ---- Get Context From Above Canvas ----
    gl = canvas.getContext("webgl2");
    if (gl == null) {
        console.log("Getting WebGL2 Context Failed\n");
    }
    else {
        console.log("Getting WebGL2 Context Succeeded\n");
    }

    // ----- Set WebGL2 Context's view Width and view height properties -----
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    // ------ Vertex Shader ------
    var vertexShaderSourceCode =
            "#version 300 es" +
            "\n" +
            "in vec4 aPosition;" +
            "in vec4 aColor;" +
            "uniform mat4 uMVPMatrix;" +
            "out vec4 oColor;" +
            "void main(void)" +
            "{" +
            "gl_Position=aPosition;" +
            "oColor=aColor;" +
            "gl_Position= uMVPMatrix * aPosition;" +
            "}";

    var vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShaderObject, vertexShaderSourceCode);

    gl.compileShader(vertexShaderObject);
    
    if (gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS) == false)
    {
        var error = gl.getShaderInfoLog(vertexShaderObject);
        if (error.length > 0) {
            var log = "Vertex Shader Compilation Error : " + error;
            alert(log);
            uninitialize();
        }
        else
        {
            console.log("Vertex Shader Compiled Successfully\n");
        }
    }

    // ----- Fragment Shader ------
    var fragmentShaderSourceCode =
            "#version 300 es" +
            "\n" +
            "precision highp float;" +
            "in vec4 oColor;" +
            "out vec4 FragColor;" +
            "void main(void)" +
            "{" +
            "FragColor = oColor;" +
            "}";

    var fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderObject, fragmentShaderSourceCode);
    gl.compileShader(fragmentShaderObject);

    if (gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS) == false)
    {
        var error = gl.getShaderInfoLog(vertexShaderObject);
        if (error.length > 0) {
            var log = "Fragment Shader Compilation Error : " + error;
            alert(log);
            uninitialize();
        }
        else
        {
            console.log("Fragment Shader Copiled Successfully\n");
        }
    }

    // ---- Linking Shader -------
    shaderProgramObject = gl.createProgram();

    gl.attachShader(shaderProgramObject, vertexShaderObject);
    gl.attachShader(shaderProgramObject, fragmentShaderObject);

    gl.bindAttribLocation(shaderProgramObject, VertexAtrributeEnum.AMC_ATTRIBUTE_POSITION, "aPosition");
    gl.bindAttribLocation(shaderProgramObject, VertexAtrributeEnum.AMC_ATTRIBUTE_COLOR, "aColor");
    gl.linkProgram(shaderProgramObject);

    if (gl.getProgramParameter(shaderProgramObject, gl.LINK_STATUS) == false)
    {
        var error = gl.getProgramInfoLog(fragmentShaderObject);
        if (error.length > 0) {
            var log = "Sahder Link Info Log : " + error;
            alert(log);
            uninitialize();
        }
        else
        {
            console.log("Shader Program Linked Successfully\n");
        }
    }

    // ---- Get Shader Uniform Location -----
    mvpMatrixUniform = gl.getUniformLocation(shaderProgramObject, "uMVPMatrix");

    // ----- Geometry Attribute Declaration -----
    var pyramid_position = new Float32Array([
        // Front 
        0.0, 1.0, 0.0,
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        // Right
        0.0, 1.0, 0.0,
        1.0, -1.0, 1.0,
        1.0, -1.0, -1.0,
        // Back
        0.0, 1.0, 0.0,
        1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0,
        // Left
        0.0, 1.0, 0.0,
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0
    ]);

    var pyramid_color = new Float32Array([
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0,

        1.0, 0.0, 0.0,
        0.0, 0.0, 1.0,
        0.0, 1.0, 0.0,

        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0,

        1.0, 0.0, 0.0,
        0.0, 0.0, 1.0,
        0.0, 1.0, 0.0
    ]);

    // ---- VAO ----
    vaoPyramid = gl.createVertexArray();
    gl.bindVertexArray(vaoPyramid);

    // ---- VBO For Position ----
    vbo_position_pyramid = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_position_pyramid);
    gl.bufferData(gl.ARRAY_BUFFER, pyramid_position, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAtrributeEnum.AMC_ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAtrributeEnum.AMC_ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // ---- VBO For Color ----
    vbo_color_pyramid = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_color_pyramid);
    gl.bufferData(gl.ARRAY_BUFFER, pyramid_color, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAtrributeEnum.AMC_ATTRIBUTE_COLOR, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAtrributeEnum.AMC_ATTRIBUTE_COLOR);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // ---- Unbind VAO ----
    gl.bindVertexArray(null);

    // ----- Geometry Attribute Declaration -----
    var cube_position = new Float32Array([
        // front
        1.0, 1.0, 1.0, // top-right of front
        -1.0, 1.0, 1.0, // top-left of front
        -1.0, -1.0, 1.0, // bottom-left of front
        1.0, -1.0, 1.0, // bottom-right of front

        // right
        1.0, 1.0, -1.0, // top-right of right
        1.0, 1.0, 1.0, // top-left of right
        1.0, -1.0, 1.0, // bottom-left of right
        1.0, -1.0, -1.0, // bottom-right of right

        // back
        1.0, 1.0, -1.0, // top-right of back
        -1.0, 1.0, -1.0, // top-left of back
        -1.0, -1.0, -1.0, // bottom-left of back
        1.0, -1.0, -1.0, // bottom-right of back

        // left
        -1.0, 1.0, 1.0, // top-right of left
        -1.0, 1.0, -1.0, // top-left of left
        -1.0, -1.0, -1.0, // bottom-left of left
        -1.0, -1.0, 1.0, // bottom-right of left

        // top
        1.0, 1.0, -1.0, // top-right of top
        -1.0, 1.0, -1.0, // top-left of top
        -1.0, 1.0, 1.0, // bottom-left of top
        1.0, 1.0, 1.0, // bottom-right of top

        // bottom
        1.0, -1.0, 1.0, // top-right of bottom
        -1.0, -1.0, 1.0, // top-left of bottom
        -1.0, -1.0, -1.0, // bottom-left of bottom
        1.0, -1.0, -1.0, // bottom-right of bottom
    ]);

    var cube_color = new Float32Array([
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,

        1.0, 0.5, 0.0,
        1.0, 0.5, 0.0,
        1.0, 0.5, 0.0,
        1.0, 0.5, 0.0,

        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,

        1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,

        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,

        1.0, 0.0, 1.0,
        1.0, 0.0, 1.0,
        1.0, 0.0, 1.0,
        1.0, 0.0, 1.0
    ])

    // ---- VAO ----
    vaoCube = gl.createVertexArray();
    gl.bindVertexArray(vaoCube);

    // ---- VBO For Position ----
    vbo_position_cube = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_position_cube);
    gl.bufferData(gl.ARRAY_BUFFER, cube_position, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAtrributeEnum.AMC_ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAtrributeEnum.AMC_ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // ---- VBO For Color ----
    vbo_color_cube = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_color_cube);
    gl.bufferData(gl.ARRAY_BUFFER, cube_color, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAtrributeEnum.AMC_ATTRIBUTE_COLOR, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAtrributeEnum.AMC_ATTRIBUTE_COLOR);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // ---- Unbind VAO ----
    gl.bindVertexArray(null);

    // --- Depth Lines ----
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // ---- Set Clear Color ----
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // ---- Initialize Projection Matrix ----
    perspectiveMatrixProjection = mat4.create();

}

function resize()
{
    // Code
    if (bFullScreen == true) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    else
    {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;
    }

    // ---- Set viewport ----
    gl.viewport(0, 0, canvas.width, canvas.height);

    // ---- Set Perspective Proection ----
    mat4.perspective(perspectiveMatrixProjection, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 0.1, 100.0);
}

function degToRad(degrees)
{
    return (degrees * Math.PI / 180.0);
}

function display()
{
    // Code
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgramObject);

    // ---- Transformations ----
    var modelViewMatrix = mat4.create();
    var modelViewProjectionMatrix = mat4.create();
    var translationMatrix = mat4.create();
    var scaleMatrix = mat4.create();
    var rotationMatrix = mat4.create();
    var rotationMatrix1 = mat4.create();
    var rotationMatrix2 = mat4.create();
    var rotationMatrix3 = mat4.create();

    // ------ Pyramid ------
    mat4.translate(translationMatrix, translationMatrix, [-1.5, 0.0, -5.0]);
    mat4.rotateY(rotationMatrix, rotationMatrix, degToRad(anglePyramid));

    mat4.multiply(modelViewMatrix, translationMatrix, rotationMatrix);
    mat4.multiply(modelViewProjectionMatrix, perspectiveMatrixProjection, modelViewMatrix);

    gl.uniformMatrix4fv(mvpMatrixUniform, false, modelViewProjectionMatrix);
    gl.bindVertexArray(vaoPyramid);
    gl.drawArrays(gl.TRIANGLES, 0, 12);
    gl.bindVertexArray(null);

    // ----- Cube ------
    modelViewMatrix = mat4.create();
    modelViewProjectionMatrix = mat4.create();
    translationMatrix = mat4.create();
    rotationMatrix = mat4.create();
    rotationMatrix1 = mat4.create();
    rotationMatrix2 = mat4.create();
    rotationMatrix3 = mat4.create();

    mat4.translate(translationMatrix, translationMatrix, [1.5, 0.0, -5.0]);
    mat4.scale(scaleMatrix, scaleMatrix, [0.75, 0.75, 0.75]);

    mat4.rotateX(rotationMatrix1, rotationMatrix1, degToRad(angleCube));
    mat4.rotateY(rotationMatrix2, rotationMatrix2, degToRad(angleCube));
    mat4.rotateZ(rotationMatrix3, rotationMatrix3, degToRad(angleCube));

    mat4.multiply(rotationMatrix1, rotationMatrix1, rotationMatrix2);
    mat4.multiply(rotationMatrix, rotationMatrix1, rotationMatrix3);

    mat4.multiply(modelViewMatrix, translationMatrix, scaleMatrix);
    mat4.multiply(modelViewMatrix, modelViewMatrix, rotationMatrix);
    mat4.multiply(modelViewProjectionMatrix, perspectiveMatrixProjection, modelViewMatrix);

    gl.uniformMatrix4fv(mvpMatrixUniform, false, modelViewProjectionMatrix);

    gl.bindVertexArray(vaoCube);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 12, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 16, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 20, 4);

    gl.bindVertexArray(null);

    gl.useProgram(null);

    update();

    // ---- Double Buffering -----
    requestAnimationFrame(display, canvas);
}

function update()
{
    // Code
    anglePyramid = anglePyramid + 1.0;
    if (anglePyramid >= 360.0)
    {
        anglePyramid = anglePyramid - 360.0;
    }

    angleCube = angleCube + 1.0;
    if (angleCube >= 360.0)
    {
        angleCube = angleCube - 360.0;
    }
}

function uninitialize()
{
    // Code

    if (shaderProgramObject) // This statement can be shaderProgramObject is not null
    {
        gl.useProgram(shaderProgramObject);

        var shaderObjects = gl.getAttachedShaders(shaderProgramObject);
        if (shaderObjects && shaderObjects.length > 0)
        {
            for (let i = 0; i < shaderObjects.length; i++)
            {
                gl.detachShader(shaderProgramObject, shaderObjects[i]);
                gl.deleteShader(shaderObjects[i]);
                shaderObjects[i] = null;
            }
        }
        gl.useProgram(null);
        gl.deleteProgram(shaderProgramObject);
        shaderProgramObject = null;
    }

    if (vbo_color_pyramid) {
        gl.deleteBuffer(vbo_color_pyramid);
        vbo_color_pyramid = null;
    }

    if (vbo_position_pyramid) {
        gl.deleteBuffer(vbo_position_pyramid);
        vbo_position_pyramid = null;
    }

    if (vaoPyramid) {
        gl.deleteVertexArray(vaoPyramid);
        vaoPyramid = null;
    }

    if (vbo_color_cube)
    {
        gl.deleteBuffer(vbo_color_cube);
        vbo_color_cube = null;
    }

    if (vbo_position_cube)
    {
        gl.deleteBuffer(vbo_position_cube);
        vbo_position_cube = null;
    }

    if (vaoCube)
    {
        gl.deleteVertexArray(vaoCube);
        vaoCube = null;
    }
}
