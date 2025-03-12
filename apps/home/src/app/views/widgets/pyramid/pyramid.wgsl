struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) normal: vec3<f32>,
    @location(1) fragPos: vec3<f32>,
};

struct Uniforms {
    projectionMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>,
    rotationAngle: f32,
    rotationXAngle: f32,
    rotationZAngle: f32,
    padding: f32, // Padding to align to 16 bytes
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vertex_main(@location(0) position: vec3<f32>, @location(1) normal: vec3<f32>) -> VertexOutput {
    // Rotation matrix around the Y-axis
    let angle = uniforms.rotationAngle;
    let cosAngle = cos(angle);
    let sinAngle = sin(angle);
    let rotationMatrixY = mat4x4<f32>(
        vec4<f32>(cosAngle, 0.0, -sinAngle, 0.0),
        vec4<f32>(0.0, 1.0, 0.0, 0.0),
        vec4<f32>(sinAngle, 0.0, cosAngle, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0)
    );

    // Rotation matrix around the X-axis
    let angleX = uniforms.rotationXAngle;
    let cosAngleX = cos(angleX);
    let sinAngleX = sin(angleX);
    let rotationMatrixX = mat4x4<f32>(
        vec4<f32>(1.0, 0.0, 0.0, 0.0),
        vec4<f32>(0.0, cosAngleX, -sinAngleX, 0.0),
        vec4<f32>(0.0, sinAngleX, cosAngleX, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0)
    );

    // Rotation matrix around the Z-axis
    let angleZ = uniforms.rotationZAngle;
    let cosAngleZ = cos(angleZ);
    let sinAngleZ = sin(angleZ);
    let rotationMatrixZ = mat4x4<f32>(
        vec4<f32>(cosAngleZ, -sinAngleZ, 0.0, 0.0),
        vec4<f32>(sinAngleZ, cosAngleZ, 0.0, 0.0),
        vec4<f32>(0.0, 0.0, 1.0, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0)
    );

    // Combine rotations (order matters: Z then X then Y)
    let combinedRotation = rotationMatrixY * rotationMatrixX * rotationMatrixZ;

    var output: VertexOutput;
    let rotatedPosition = combinedRotation * vec4<f32>(position, 1.0);
    output.position = uniforms.projectionMatrix * uniforms.viewMatrix * rotatedPosition;
    output.normal = (combinedRotation * vec4<f32>(normal, 0.0)).xyz;
    output.fragPos = rotatedPosition.xyz;
    return output;
}

@fragment
fn fragment_main(@location(0) normal: vec3<f32>, @location(1) fragPos: vec3<f32>) -> @location(0) vec4<f32> {
    // Light properties
    let lightPos1 = vec3<f32>(2.0, 2.0, 2.0); // Light source to the right and in front
    let lightColor1 = vec3<f32>(1.0, 0.5, 0.5);
    let lightPos2 = vec3<f32>(-2.0, -2.0, 1.0); // Light source to the left and back
    let lightColor2 = vec3<f32>(0.5, 0.5, 1.0);

    // Material properties
    let objectColor = vec3<f32>(0.5, 0.5, 0.5);
    let ambientStrength = 0.3;
    let specularStrength = 0.9;
    let shininess = 32.0;

    // Ambient
    let ambient = ambientStrength * (lightColor1 + lightColor2);

    // Diffuse
    let norm = normalize(normal);
    let lightDir1 = normalize(lightPos1 - fragPos);
    let lightDir2 = normalize(lightPos2 - fragPos);
    let diff1 = max(dot(norm, lightDir1), 0.0);
    let diff2 = max(dot(norm, lightDir2), 0.0);
    let diffuse = (diff1 * lightColor1) + (diff2 * lightColor2);

    // Specular
    let viewPos = vec3<f32>(0.0, 0.0, 3.0); // Camera position
    let viewDir = normalize(viewPos - fragPos);
    let reflectDir1 = reflect(-lightDir1, norm);
    let reflectDir2 = reflect(-lightDir2, norm);
    let spec1 = pow(max(dot(viewDir, reflectDir1), 0.0), shininess);
    let spec2 = pow(max(dot(viewDir, reflectDir2), 0.0), shininess);
    let specular = specularStrength * (spec1 * lightColor1 + spec2 * lightColor2);

    // Combine results
    let result = (ambient + diffuse + specular) * objectColor;
    return vec4<f32>(result, 1.0);
}