/**
 * Draw the vertices of a triangle.
 */
@vertex fn vertex_shader(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
  let pos = array(
    vec2f( 0.0,  0.5),  // top center
    vec2f(-0.5, -0.5),  // bottom left
    vec2f( 0.5, -0.5)   // bottom right
  );

  return vec4f(pos[vertexIndex], 0.0, 1.0);
}

/**
 * Fill the triangle with red.
 */
@fragment fn fragment_shader() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}