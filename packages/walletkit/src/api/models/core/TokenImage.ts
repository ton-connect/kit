import { Base64String } from "./Primitives";

export interface TokenImage {
    /**
     * URL to the image
     * @format url
     */
    url?: string;

    /** 
     * URL to small version of the image 
     * @format url
     * */
    smallUrl?: string;

    /** 
     * URL to medium version of the image 
     * @format url
     * */
    mediumUrl?: string;

    /** 
     * URL to large version of the image 
     * @format url
     * */
    largeUrl?: string;

    /** 
     * Binary image data 
     * @format byte
     * */
    data?: string;
}