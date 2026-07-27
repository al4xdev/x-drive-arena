package com.xdrive.arena;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class AppConfigurationTest {

    @Test
    public void applicationMetadataMatchesPublishedPackage() {
        assertEquals("com.xdrive.arena", BuildConfig.APPLICATION_ID);
        assertEquals("1.0", BuildConfig.VERSION_NAME);
        assertEquals(1, BuildConfig.VERSION_CODE);
    }
}
