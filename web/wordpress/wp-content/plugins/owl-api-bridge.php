<?php
/**
 * Plugin Name: OWL API Bridge
 * Plugin URI:  https://github.com/pingdynasty/OwlServer
 * Description: Provides an XML RPC method that allows the OWL API to validate a WordPress authentication cookie.
 * Version:     1.0.0
 * Author:      Sam Artuso <sam@highoctanedev.co.uk>
 * Author URI:  http://www.hoxtonowl.com/
 * License:     WTFPL 2.0 http://www.wtfpl.net/
 */

defined('ABSPATH') or die('No script kiddies please!');

define('DOING_AJAX', true);

/*
 * This part of this plugin exposes an XML RPC method that allows the OWL API
 * to validate a WordPress authentication cookie.
 */

/**
 * Validates a WordPress `logged_in_*` authentication cookie.
 *
 * Exposed as an XML-RPC method.
 *
 * @param string $cookie
 *     Value of the WordPress `logged_in_*` cookie.
 * @param string $scheme
 * @return boolean
 *     Whether the cookie is valid.
 */
function owl_validateAuthCookie($cookie, $scheme = 'logged_in')
{
    return wp_validate_auth_cookie($cookie, $scheme);
}

/**
 * Returns some information on the specified user.
 *
 * Exposed as an XML-RPC method.
 *
 * @param string $username
 *     The user ID.
 * @return array|boolean
 *     An array whose keys are 'id', 'display_name' and 'admin', and whose values
 *     are respectively a boolean telling whether the user is a WP admin and the
 *     user ID of the user. Returns false if the user could not be found or if
 *     an error occurred.
 *
 * @todo FIXME - This function must be rewritten to accept the WP user ID as
 *       a parameter instead of the username.
 */
function owl_getUserInfo($username)
{
    $args = array(
        'search'         => $username,
        'search_columns' => [ 'user_login' ]
    );
    $userQuery = new WP_User_Query($args);

    if (1 !== count($userQuery->results)) {
        return false;
    } else {
        return array(
            'id'           => $userQuery->results[0]->ID,
            'display_name' => $userQuery->results[0]->display_name,
            'admin'        => in_array('administrator', $userQuery->results[0]->roles),
        );
    }
}

/**
 * Returns information about the users identified by the specified user IDs.
 *
 * Exposed as an XML-RPC method.
 *
 * @param array[int]
 *     An array of user IDs.
 * @return array
 *     An associative array whose keys are WP user IDs and whose values are
 *     associative arrays containing user meta data. At the moment the only
 *     piece of metadata returned is the user display name.
 */
function owl_getUserInfoBatch($userIds)
{
    global $wpdb;

    $userIds = array_map('intval', $userIds);
    $sql = 'SELECT ID, display_name FROM ' . $wpdb->prefix . 'users WHERE ID IN(' . implode(', ', $userIds) . ')';
    $users = $wpdb->get_results($sql);

    $result = [];
    foreach ($users as $user) {
        $result[$user->ID] = array('display_name' => $user->display_name);
    }

    file_put_contents('/tmp/debug.txt', var_export($result, true));

    return $result;
}

/**
 * Registers a new XML-RPC methods,
 *
 * @param array $methods
 *     Methods array.
 * @return array
 *     Methods array.
 */
function owl_new_xmlrpc_methods($methods)
{
    $methods['owl.validateAuthCookie'] = 'owl_validateAuthCookie';
    $methods['owl.getUserInfo']        = 'owl_getUserInfo';
    $methods['owl.getUserInfoBatch']   = 'owl_getUserInfoBatch';

    return $methods;
}

add_filter('xmlrpc_methods', 'owl_new_xmlrpc_methods');

/**
 * Provides an AJAX endpoint for the username autocomplete functionality of the
 * add/edit patch form.
 */
function owl_usernameAutocomplete()
{

    global $wpdb;

    $pattern = $_POST['q'];

    $args = array(
        'search'         => $pattern . '*',
        'search_columns' => array('user_login'),
        'orderby'        => 'user_login',
        'order'          => 'ASC',
        'count_total' => true,
    );

    $userQuery = new WP_User_Query($args);

    $result = array(
        'incomplete_results' => false,
        'items' => array()
    );

    $result['items'] = $userQuery->results;

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_owl-username-autocomplete', 'owl_usernameAutocomplete');
add_action('wp_ajax_nopriv_owl-username-autocomplete', 'owl_usernameAutocomplete');

/**
 * Provides an AJAX endpoint for retrieving WordPress's authentication cookie.
 *
 * @param bool $return
 *     This function can also called internally. In this case, set this param
 *     to `true`.
 */
function owl_getAuthCookie($return = false)
{
    $cookies = $_COOKIE;
    $result = null;
    $cookieSig = 'wordpress_logged_in_';
    foreach ($cookies as $name => $value) {
        if (substr($name, 0, strlen($cookieSig)) === $cookieSig) {
            $result = $value;
            break;
        }
    }

    if ($return) {
        return $result;
    }

    wp_send_json($result);
    wp_die();
}

add_action('wp_ajax_owl-get-auth-cookie', 'owl_getAuthCookie');
add_action('wp_ajax_nopriv_owl-get-auth-cookie', 'owl_getAuthCookie');

// EOF
