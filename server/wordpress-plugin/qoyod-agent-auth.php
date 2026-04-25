<?php
/**
 * Plugin Name: Qoyod Agent Auth
 * Description: Allows the Qoyod Creative Agent to authenticate via X-Agent-Token header.
 * Version: 1.0
 * Author: Qoyod
 */

add_filter( 'determine_current_user', function( $user_id ) {
    $token  = $_SERVER['HTTP_X_AGENT_TOKEN'] ?? '';
    $secret = defined( 'CONTENT_AGENT_TOKEN' ) ? CONTENT_AGENT_TOKEN : get_option( 'content_agent_token' );
    if ( ! $token || ! $secret || ! hash_equals( $secret, $token ) ) return $user_id;
    $user = get_user_by( 'login', 'somaa-ai-agent' );
    return $user ? $user->ID : $user_id;
}, 20 );

add_filter( 'rest_authentication_errors', function( $result ) {
    if ( ! empty( $_SERVER['HTTP_X_AGENT_TOKEN'] ) && get_current_user_id() ) return true;
    return $result;
}, 20 );
