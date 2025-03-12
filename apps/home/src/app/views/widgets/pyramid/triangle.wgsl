/**
 * What the vertex shader will output
 */
struct VertexShaderOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

/**
 * Draw a triangle
 */
@vertex fn vertex_shader(@builtin(vertex_index) vertexIndex: u32) -> VertexShaderOutput {
  let pos = array(
    vec2f( 0.0,  0.5),  // top center
    vec2f(-0.5, -0.5),  // bottom left
    vec2f( 0.5, -0.5)   // bottom right
  );
  var color = array(
    vec4f(1, 0, 0, 1), // red
    vec4f(0, 1, 0, 1), // green
    vec4f(0, 0, 1, 1), // blue
  );

  var vsOutput: VertexShaderOutput;
  let vertex = pos[vertexIndex]; 
  vsOutput.position = vec4f(vertex, 0.0, 1.0); 
  vsOutput.color = color[vertexIndex];
  return vsOutput;
}

/**
 * Color pixels
 */
@fragment fn fragment_shader(fsInput: VertexShaderOutput) -> @location(0) vec4f {
  let black = vec4f(0, 0, 0, 1);
  let col = fsInput.color;

  let grid = vec2u(fsInput.position.xy) / 8;
  let checker = (grid.x + grid.y) % 2 == 1;

  return select(col, black, checker);
}